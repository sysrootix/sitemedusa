import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { customToast } from '@/utils/toast';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface FavoriteItem {
  id: string;
  product_id: string;
  product_name: string;
  product_data: any;
  created_at: Date;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  favoritesCount: number;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string, productName?: string, productData?: any) => Promise<void>;
  clearFavorites: () => Promise<void>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: React.FC<FavoritesProviderProps> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load favorites from API when user changes
  useEffect(() => {
    if (user) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  const refreshFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.getFavorites();
      setFavorites(response.items || []);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav.product_id === productId);
  };

  const toggleFavorite = async (productId: string, productName?: string, productData?: any) => {
    if (!user) {
      customToast.error('Войдите в аккаунт, чтобы добавить в избранное');
      return;
    }

    const isCurrentlyFavorite = isFavorite(productId);

    try {
      if (isCurrentlyFavorite) {
        await api.removeFromFavorites(productId);
        customToast.success('Удалено из избранного');
      } else {
        await api.addToFavorites({
          product_id: productId,
          product_name: productName || 'Товар',
          product_data: productData || {},
        });
        customToast.success(productName ? `${productName} добавлен в избранное` : 'Добавлено в избранное');
      }
      await refreshFavorites();
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      customToast.error(error.response?.data?.message || error.message || 'Не удалось обновить избранное');
    }
  };

  const clearFavorites = async () => {
    if (!user) return;

    try {
      await api.clearFavorites();
      customToast.success('Избранное очищено');
      await refreshFavorites();
    } catch (error: any) {
      console.error('Error clearing favorites:', error);
      customToast.error(error.response?.data?.message || error.message || 'Не удалось очистить избранное');
    }
  };

  const value: FavoritesContextType = {
    favorites,
    favoritesCount: favorites.length,
    loading,
    isFavorite,
    toggleFavorite,
    clearFavorites,
    refreshFavorites,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

