import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { customToast } from '@/utils/toast';
import { useAuth } from '../hooks/useAuth';

interface CartItem {
  id: string;
  product: any;
  modification?: any;
  quantity: number;
  price: number;
  total: number;
  shop_code: string;
  created_at: Date;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: string, shopCode: string, price: number, modificationId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart([]);
      setCartCount(0);
      setCartTotal(0);
    }
  }, [user]);

  const refreshCart = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.getCart();
      setCart(response.items || []);
      setCartCount(response.count || 0);
      setCartTotal(response.total || 0);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    productId: string,
    shopCode: string,
    price: number,
    modificationId?: string,
    quantity: number = 1
  ) => {
    if (!user) {
      customToast.error('Войдите в аккаунт, чтобы добавить товар в корзину');
      return;
    }

    try {
      await api.addToCart({
        product_id: productId,
        shop_code: shopCode,
        price,
        modification_id: modificationId,
        quantity,
      });
      customToast.success('Товар добавлен в корзину');
      await refreshCart();
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      customToast.error(error.response?.data?.message || error.message || 'Не удалось добавить товар в корзину');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;

    try {
      await api.updateCartItem(itemId, quantity);
      await refreshCart();
    } catch (error: any) {
      console.error('Error updating cart:', error);
      customToast.error(error.response?.data?.message || error.message || 'Не удалось обновить корзину');
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      await api.removeFromCart(itemId);
      customToast.success('Товар удален из корзины');
      await refreshCart();
    } catch (error: any) {
      console.error('Error removing from cart:', error);
      customToast.error(error.response?.data?.message || error.message || 'Не удалось удалить товар');
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await api.clearCart();
      customToast.success('Корзина очищена');
      await refreshCart();
    } catch (error: any) {
      console.error('Error clearing cart:', error);
      customToast.error(error.response?.data?.message || error.message || 'Не удалось очистить корзину');
    }
  };

  const value: CartContextType = {
    cart,
    cartCount,
    cartTotal,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

