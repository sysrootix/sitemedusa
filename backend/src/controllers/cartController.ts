import { Response } from 'express';
import CartItem from '../models/CartItem';
import { AuthenticatedRequest } from '../types';
import db from '../config/database';

class CartController {
  // Get user's cart
  public async getCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const cartItems = await CartItem.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
      });

      // Enrich with product details
      const enrichedItems = await Promise.all(
        cartItems.map(async (item) => {
          const [productData] = await db.query(
            `SELECT p.*, s.city, s.address, p.category_name
             FROM catalog_products p
             LEFT JOIN shop_locations s ON p.shop_code = s.shop_code
             WHERE p.id = :productId AND p.shop_code = :shopCode AND p.is_active = TRUE`,
            {
              replacements: {
                productId: item.product_id,
                shopCode: item.shop_code,
              },
            }
          );

          let modification = null;
          if (item.modification_id && productData[0]) {
            const product = productData[0] as any;
            if (product.modifications && Array.isArray(product.modifications)) {
              modification = product.modifications.find(
                (m: any) => m.id === item.modification_id
              );
            }
          }

          return {
            id: item.id,
            product: productData[0] || null,
            modification,
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            total: parseFloat(item.price.toString()) * item.quantity,
            shop_code: item.shop_code,
            created_at: item.created_at,
          };
        })
      );

      // Filter only items with valid products and calculate totals
      const validItems = enrichedItems.filter((item) => item.product !== null);
      const invalidItemIds = enrichedItems
        .filter((item) => item.product === null)
        .map((item) => item.id);

      // Remove invalid items from cart automatically
      if (invalidItemIds.length > 0) {
        await CartItem.destroy({
          where: {
            id: invalidItemIds,
            user_id: userId,
          },
        });
        console.log(`Removed ${invalidItemIds.length} invalid items from cart`);
      }

      const total = validItems.reduce((sum, item) => sum + item.total, 0);

      res.json({
        success: true,
        message: 'Cart retrieved successfully',
        data: {
          items: validItems,
          total,
          count: validItems.length,
        },
      });
    } catch (error) {
      console.error('Error getting cart:', error);
      res.status(500).json({ success: false, message: 'Failed to get cart' });
    }
  }

  // Add item to cart
  public async addToCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { product_id, shop_code, modification_id, quantity = 1, price } = req.body;

      if (!product_id || !shop_code || !price) {
        res.status(400).json({ success: false, message: 'Missing required fields' });
        return;
      }

      // Check if item already exists
      const existingItem = await CartItem.findOne({
        where: {
          user_id: userId,
          product_id,
          shop_code,
          modification_id: modification_id || null,
        },
      });

      if (existingItem) {
        // Update quantity
        existingItem.quantity += quantity;
        await existingItem.save();
        res.json({ 
          success: true, 
          message: 'Cart updated', 
          data: { item: existingItem } 
        });
      } else {
        // Create new item
        const newItem = await CartItem.create({
          user_id: userId,
          product_id,
          shop_code,
          modification_id: modification_id || null,
          quantity,
          price,
        });
        res.status(201).json({ 
          success: true, 
          message: 'Item added to cart', 
          data: { item: newItem } 
        });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ success: false, message: 'Failed to add to cart' });
    }
  }

  // Update cart item quantity
  public async updateCartItem(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { quantity } = req.body;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (quantity < 1) {
        res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
        return;
      }

      const item = await CartItem.findOne({
        where: { id, user_id: userId },
      });

      if (!item) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }

      item.quantity = quantity;
      await item.save();

      res.json({ 
        success: true, 
        message: 'Cart item updated', 
        data: { item } 
      });
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ success: false, message: 'Failed to update cart item' });
    }
  }

  // Remove item from cart
  public async removeFromCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const item = await CartItem.findOne({
        where: { id, user_id: userId },
      });

      if (!item) {
        res.status(404).json({ success: false, message: 'Item not found' });
        return;
      }

      await item.destroy();

      res.json({ 
        success: true, 
        message: 'Item removed from cart' 
      });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ success: false, message: 'Failed to remove from cart' });
    }
  }

  // Clear cart
  public async clearCart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await CartItem.destroy({
        where: { user_id: userId },
      });

      res.json({ 
        success: true, 
        message: 'Cart cleared' 
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ success: false, message: 'Failed to clear cart' });
    }
  }
}

export default new CartController();

