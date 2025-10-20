import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Store, MapPin, ShoppingCart, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import SkeletonLoader from './SkeletonLoader';

interface ProductModalProps {
  productId?: string;
  productSlug?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface ProductDetails {
  product: {
    id: string;
    name: string;
    slug?: string;
    category_id?: string;
    characteristics?: any;
    modifications?: any;
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

const ProductModal = ({ productId, productSlug, isOpen, onClose }: ProductModalProps) => {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedShops, setExpandedShops] = useState<Set<string>>(new Set());
  const [selectedModifications, setSelectedModifications] = useState<{[shopCode: string]: string}>({});
  const [showAllModifications, setShowAllModifications] = useState<{[shopCode: string]: boolean}>({});
  
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (isOpen && (productId || productSlug)) {
      loadProduct();
      setExpandedShops(new Set()); // Reset expanded state on new product
    }
  }, [isOpen, productId, productSlug]);

  // Block body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // Try loading by slug first (SEO-friendly), fallback to ID
      const data = productSlug 
        ? await api.getProductBySlug(productSlug)
        : await api.getProductById(productId!);
      setProduct(data);
    } catch (err) {
      console.error('Failed to load product:', err);
      toast.error('Не удалось загрузить товар');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleShopExpanded = (shopCode: string) => {
    const newExpanded = new Set(expandedShops);
    if (newExpanded.has(shopCode)) {
      newExpanded.delete(shopCode);
    } else {
      newExpanded.add(shopCode);
    }
    setExpandedShops(newExpanded);
  };

  const toggleShowAllModifications = (shopCode: string) => {
    setShowAllModifications(prev => ({
      ...prev,
      [shopCode]: !prev[shopCode]
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Top buttons */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex gap-2 items-center">
              {/* Favorite button */}
              {product && (
                <button
                  onClick={() => toggleFavorite(product.product.id, product.product.name, {
                    category_name: product.product.category_name,
                    price: product.product.price,
                    image_url: product.product.image_url
                  })}
                  className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center shrink-0"
                >
                  <Heart 
                    className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${isFavorite(product.product.id) ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300'}`} 
                  />
                </button>
              )}
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center shrink-0"
              >
                <X className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300 shrink-0" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[95vh] md:max-h-[90vh]">
              {loading ? (
                <SkeletonLoader variant="product-modal" count={1} />
              ) : product ? (
                <div className="p-3 md:p-8">
                  {/* Product Header */}
                  <div className="mb-4 md:mb-8">
                    <div className="flex flex-col md:flex-row items-start gap-3 md:gap-6">
                      {/* Product Image Placeholder */}
                      <div className="flex-shrink-0 w-20 h-20 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-700 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto md:mx-0">
                        <Package className="w-10 h-10 md:w-16 md:h-16 text-gray-400 dark:text-gray-500" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white mb-2 px-2">
                          {product.product.name}
                        </h2>

                        {/* Price Range */}
                        <div className="flex items-baseline justify-center md:justify-start gap-2 mb-3">
                          {product.min_price === product.max_price ? (
                            <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                              {Math.round(product.min_price).toLocaleString('ru-RU')} ₽
                            </span>
                          ) : (
                            <>
                              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                {Math.round(product.min_price).toLocaleString('ru-RU')}
                              </span>
                              <span className="text-lg md:text-xl text-gray-500 dark:text-gray-400">—</span>
                              <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                {Math.round(product.max_price).toLocaleString('ru-RU')} ₽
                              </span>
                            </>
                          )}
                        </div>

                        {/* Total Stock */}
                        <div className="flex items-center justify-center md:justify-start gap-2 text-xs md:text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Всего в наличии:
                          </span>
                          <span className={`font-semibold ${
                            product.total_quantity > 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {Math.round(product.total_quantity)} шт.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Characteristics */}
                  {product.product.characteristics && Object.keys(product.product.characteristics).length > 0 && (
                    <div className="mb-4 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-blue-100 dark:border-gray-600">
                      <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Категория
                      </h3>
                      <div className="space-y-2 overflow-x-auto">
                        {Object.entries(product.product.characteristics).map(([key, value]) => {
                          // Format full_path nicely
                          if (key === 'full_path' && typeof value === 'string') {
                            const pathParts = value.split(' > ');
                            return (
                              <div key={key} className="flex items-center gap-1.5 md:gap-2 text-xs md:text-base pb-2">
                                {pathParts.map((part, index) => (
                                  <div key={index} className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                                    {index > 0 && (
                                      <svg className="w-3 h-3 md:w-4 md:h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    )}
                                    <span className={`px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-medium whitespace-nowrap ${
                                      index === pathParts.length - 1
                                        ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                                        : 'bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {part.trim()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          return (
                            <div key={key}>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{key}:</span>
                              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Availability in Shops */}
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 md:w-5 md:h-5" />
                      Наличие в магазинах
                    </h3>

                    {/* Group shops by city */}
                    {(() => {
                      const shopsByCity = product.shops.reduce((acc, shop) => {
                        if (!acc[shop.city]) {
                          acc[shop.city] = [];
                        }
                        acc[shop.city].push(shop);
                        return acc;
                      }, {} as Record<string, typeof product.shops>);

                      return (
                        <div className="space-y-4">
                          {Object.entries(shopsByCity).map(([city, cityShops]) => (
                            <div key={city} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                              {/* City header */}
                              <div className="bg-gray-50 dark:bg-gray-800/50 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{city}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      ({cityShops.length} {cityShops.length === 1 ? 'магазин' : cityShops.length < 5 ? 'магазина' : 'магазинов'})
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Shops list */}
                              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                {cityShops.map((shop, index) => (
                        <motion.div
                          key={shop.shop_code}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`px-3 py-2.5 transition-colors ${
                            shop.available
                              ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/80'
                              : 'bg-gray-50 dark:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex flex-col gap-2">
                            {/* Compact shop info */}
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {shop.address}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className={`text-xs ${
                                    shop.available
                                      ? 'text-green-600 dark:text-green-400 font-medium'
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {shop.available
                                      ? `${Math.round(shop.quantity || 0)} шт.`
                                      : 'Нет в наличии'}
                                  </span>
                                  {shop.price && (
                                    <>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {Math.round(shop.price).toLocaleString('ru-RU')} ₽
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {/* Add to cart button - compact inline */}
                              {shop.available && (() => {
                                // Check if modification is required but not selected
                                const hasModifications = shop.modifications && shop.modifications.length > 0;
                                const isSingleEmptyMod = hasModifications && shop.modifications.length === 1 && (!shop.modifications[0].name || !shop.modifications[0].name.trim());
                                const modId = selectedModifications[shop.shop_code];
                                const isDisabled = hasModifications && !isSingleEmptyMod && !modId;
                                
                                return (
                                <button
                                  onClick={() => {
                                    let finalModId = modId;
                                    
                                    // If only one modification with empty name - use it automatically
                                    if (!finalModId && isSingleEmptyMod) {
                                      finalModId = shop.modifications[0].id;
                                    }
                                    
                                    // Check if modification is required but not selected
                                    if (hasModifications && !finalModId && !isSingleEmptyMod) {
                                      toast.error('Выберите вариант товара');
                                      return;
                                    }
                                    
                                    addToCart(
                                      product.product.id,
                                      shop.shop_code,
                                      shop.price || 0,
                                      finalModId
                                    );
                                  }}
                                  disabled={isDisabled}
                                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg transition-colors font-medium text-xs flex items-center gap-1.5 ${
                                    isDisabled
                                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                      : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                                  }`}
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  <span>В корзину</span>
                                </button>
                                );
                              })()}
                            </div>
                                
                            {/* Modifications - Minimalist white buttons */}
                            {(() => {
                              // Skip if no modifications
                              if (!shop.modifications || !Array.isArray(shop.modifications) || shop.modifications.length === 0) {
                                return null;
                              }
                              
                              // If only one modification with empty name - hide the section
                              if (shop.modifications.length === 1 && (!shop.modifications[0].name || !shop.modifications[0].name.trim())) {
                                return null;
                              }
                              
                              return (
                              <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                                  Выберите вариант:
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {(showAllModifications[shop.shop_code] 
                                    ? shop.modifications 
                                    : shop.modifications.slice(0, 6)
                                  ).map((mod: any, index: number) => {
                                    // Handle empty or whitespace-only names
                                    const displayName = mod.name && mod.name.trim() 
                                      ? mod.name.trim() 
                                      : `Вариант ${index + 1}`;
                                    
                                    return (
                                    <button
                                      key={mod.id}
                                      onClick={() => setSelectedModifications({
                                        ...selectedModifications,
                                        [shop.shop_code]: selectedModifications[shop.shop_code] === mod.id ? '' : mod.id
                                      })}
                                      disabled={!mod.quanty || mod.quanty <= 0}
                                      className={`
                                        px-2.5 py-1.5 rounded-lg border text-xs transition-all
                                        ${selectedModifications[shop.shop_code] === mod.id
                                          ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700'
                                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                                        }
                                        ${!mod.quanty || mod.quanty <= 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                                      `}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          {displayName}
                                        </span>
                                        {mod.quanty > 0 && (
                                          <span className="text-gray-500 dark:text-gray-400">
                                            ({Math.round(mod.quanty)})
                                          </span>
                                        )}
                                      </div>
                                    </button>
                                    );
                                  })}
                                </div>
                                
                                {/* Show/Hide button if more than 6 modifications */}
                                {shop.modifications.length > 6 && (
                                  <button
                                    onClick={() => toggleShowAllModifications(shop.shop_code)}
                                    className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                  >
                                    {showAllModifications[shop.shop_code] ? (
                                      <>
                                        <ChevronUp className="w-3.5 h-3.5" />
                                        <span>Скрыть варианты</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5" />
                                        <span>Показать все варианты ({shop.modifications.length})</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                              );
                            })()}
                          </div>
                        </motion.div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Modifications */}
                  {product.product.modifications && Array.isArray(product.product.modifications) && product.product.modifications.length > 0 && (
                    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Варианты
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {product.product.modifications.map((mod: any, index: number) => (
                          <div
                            key={index}
                            className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {mod.name}
                            </div>
                            {mod.retail_price && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {Math.round(mod.retail_price).toLocaleString('ru-RU')} ₽
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                  Товар не найден
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;

