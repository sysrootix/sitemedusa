import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

export interface ProductDetailsData {
  product: {
    id: string;
    name: string;
    slug?: string;
    category_id?: string;
    category_name?: string;
    characteristics?: any;
    modifications?: any;
    price?: number | null;
    image_url?: string | null;
  };
  shops: Array<{
    shop_code: string;
    shop_name: string;
    city: string;
    address: string;
    quantity: number | null;
    price: number | null;
    modifications?: any;
    available: boolean;
  }>;
  total_quantity: number;
  min_price: number;
  max_price: number;
}

interface UseProductDetailsOptions {
  productId?: string | null;
  productSlug?: string | null;
  enabled?: boolean;
  initialProduct?: ProductDetailsData | null;
}

export function useProductDetails({
  productId,
  productSlug,
  enabled = true,
  initialProduct = null,
}: UseProductDetailsOptions) {
  const [product, setProduct] = useState<ProductDetailsData | null>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!initialProduct) {
      return;
    }

    if (productSlug && initialProduct.product.slug && initialProduct.product.slug !== productSlug) {
      return;
    }

    if (productId && initialProduct.product.id !== productId) {
      return;
    }

    if (isMountedRef.current) {
      setProduct(initialProduct);
      setError(null);
      setLoading(false);
    }
  }, [initialProduct, productId, productSlug]);

  const fetchProduct = useCallback(async () => {
    if (!productId && !productSlug) {
      if (isMountedRef.current) {
        setProduct(null);
        setLoading(false);
      }
      return null;
    }

    const matchesInitial = initialProduct && (
      (productSlug && initialProduct.product.slug && initialProduct.product.slug === productSlug) ||
      (productId && initialProduct.product.id === productId)
    );

    if (matchesInitial) {
      if (isMountedRef.current) {
        setProduct(initialProduct);
        setError(null);
        setLoading(false);
      }
      return initialProduct;
    }

    if (isMountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const data = productSlug
        ? await api.getProductBySlug(productSlug)
        : await api.getProductById(productId!);

      if (isMountedRef.current) {
        setProduct(data);
      }

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load product');
      if (isMountedRef.current) {
        setError(error);
        setProduct(null);
      }
      throw error;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [productId, productSlug, initialProduct]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    fetchProduct().catch(() => undefined);
  }, [fetchProduct, enabled]);

  return {
    product,
    loading,
    error,
    reload: fetchProduct,
  };
}
