import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Store, MapPin, ShoppingCart, Heart, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useProductDetails, type ProductDetailsData } from '../hooks/useProductDetails';
import SkeletonLoader from './SkeletonLoader';

interface ProductModalProps {
  productId?: string;
  productSlug?: string;
  isOpen?: boolean;
  onClose?: () => void;
  displayMode?: 'modal' | 'page';
  onNavigateBack?: () => void;
  initialProduct?: ProductDetailsData | null;
}

const ProductModal = ({
  productId,
  productSlug,
  isOpen = true,
  onClose,
  displayMode = 'modal',
  onNavigateBack,
  initialProduct = null,
}: ProductModalProps) => {
  const [expandedShops, setExpandedShops] = useState<Set<string>>(new Set());
  const [selectedModifications, setSelectedModifications] = useState<{ [shopCode: string]: string }>({});
  const [showAllModifications, setShowAllModifications] = useState<{ [shopCode: string]: boolean }>({});

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { product, loading, error } = useProductDetails({
    productId,
    productSlug,
    enabled: displayMode === 'modal' ? isOpen : true,
    initialProduct,
  });

  useEffect(() => {
    if (!product) {
      return;
    }
    setExpandedShops(new Set());
    setSelectedModifications({});
    setShowAllModifications({});

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [product?.product.id]);

  useEffect(() => {
    if (!error) {
      return;
    }

    console.error('Failed to load product:', error);
    toast.error('Не удалось загрузить товар');

    if (displayMode === 'modal' && onClose) {
      onClose();
    }
  }, [error, displayMode, onClose]);

  useEffect(() => {
    if (displayMode !== 'modal') {
      return;
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [displayMode, isOpen]);

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
      [shopCode]: !prev[shopCode],
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (displayMode !== 'modal') {
      return;
    }
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  const cardClasses = displayMode === 'modal'
    ? 'relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl shadow-2xl overflow-hidden'
    : 'relative w-full max-w-5xl mx-auto bg-white dark:bg-gray-900/80 rounded-2xl md:rounded-3xl shadow-lg md:shadow-xl overflow-hidden';

  const scrollClasses = displayMode === 'modal'
    ? 'overflow-y-auto max-h-[95vh] md:max-h-[90vh]'
    : 'overflow-y-auto';

  const favoriteButton = product ? (
    <button
      onClick={() => toggleFavorite(product.product.id, product.product.name, {
        category_name: product.product.category_name,
        price: product.product.price,
        image_url: product.product.image_url,
      })}
      className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center shrink-0"
    >
      <Heart
        className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${isFavorite(product.product.id) ? 'fill-red-500 text-red-500' : 'text-gray-700 dark:text-gray-300'}`}
      />
    </button>
  ) : null;

  const modalTopActions = displayMode === 'modal' ? (
    <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10 flex gap-2 items-center">
      {favoriteButton}
      {onClose && (
        <button
          onClick={onClose}
          className="p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center shrink-0"
        >
          <X className="w-5 h-5 md:w-6 md:h-6 text-gray-700 dark:text-gray-300 shrink-0" />
        </button>
      )}
    </div>
  ) : null;

  const pageTopbar = displayMode === 'page' ? (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60">
      <div className="flex items-center gap-2">
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Назад</span>
          </button>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">Карточка товара</span>
      </div>
      <div className="flex items-center gap-2">
        {favoriteButton}
      </div>
    </div>
  ) : null;

  const content = (
    <>
      {modalTopActions}
      <div className={scrollClasses}>
        {pageTopbar}
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
                          {Array.isArray(value)
                            ? value.filter(Boolean).join(', ')
                            : typeof value === 'object' && value !== null
                              ? JSON.stringify(value)
                              : String(value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shops */}
            {/* Shop availability summary */}
            {product.shops && product.shops.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Товар доступен в {product.shops.filter(shop => shop.available).length} из {product.shops.length} магазинов.
                </p>
              </div>
            )}

            {/* Detailed descriptions */}
            {product.product.characteristics && product.product.characteristics.description && (
              <div className="mt-6 md:mt-8">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Описание
                </h3>
                <div className="prose prose-sm md:prose base prose-gray max-w-none dark:prose-invert">
                  <p>{product.product.characteristics.description}</p>
                </div>
              </div>
            )}

            {/* Shops detailed list */}
            {product.shops && product.shops.length > 0 && (
              <div className="mt-6 md:mt-8">
                <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Выберите магазин
                </h3>
                <div className="space-y-3">
                  {product.shops.map(shop => (
                    <motion.div
                      key={`${shop.shop_code}-compact`}
                      layout
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                            <Store className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                          </div>
                          <div>
                            <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                              {shop.shop_name}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{shop.city}, {shop.address}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 md:gap-4">
                          <div className={`text-xs md:text-sm font-medium ${
                            shop.available
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {shop.available ? 'В наличии' : 'Нет в наличии'}
                          </div>
                          <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                            {shop.price ? `${Math.round(shop.price).toLocaleString('ru-RU')} ₽` : '—'}
                          </div>
                          <button
                            onClick={() => {
                              const modId = selectedModifications[shop.shop_code];
                              const hasModifications = Array.isArray(shop.modifications) && shop.modifications.length > 0;
                              if (hasModifications && !modId) {
                                toast.error('Выберите вариант товара');
                                return;
                              }

                              addToCart(
                                product.product.id,
                                shop.shop_code,
                                shop.price || 0,
                                modId,
                              );
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Добавить</span>
                          </button>
                        </div>
                      </div>

                      {shop.modifications && shop.modifications.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Выберите вариант:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(showAllModifications[shop.shop_code]
                              ? shop.modifications
                              : shop.modifications.slice(0, 6)
                            ).map((mod: any, index: number) => {
                              const displayName = mod.name && mod.name.trim()
                                ? mod.name.trim()
                                : `Вариант ${index + 1}`;
                              return (
                                <button
                                  key={mod.id}
                                  onClick={() => setSelectedModifications({
                                    ...selectedModifications,
                                    [shop.shop_code]: selectedModifications[shop.shop_code] === mod.id ? '' : mod.id,
                                  })}
                                  disabled={!mod.quanty || mod.quanty <= 0}
                                  className={`px-3 py-1.5 rounded-full border text-xs transition-all ${
                                    selectedModifications[shop.shop_code] === mod.id
                                      ? 'border-purple-600 bg-purple-50 dark:border-purple-300 dark:bg-purple-900/40 text-purple-700 dark:text-purple-200'
                                      : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-400 text-gray-600 dark:text-gray-300'
                                  } ${!mod.quanty || mod.quanty <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-medium">{displayName}</span>
                                    {mod.quanty > 0 && (
                                      <span className="text-gray-500 dark:text-gray-400">{Math.round(mod.quanty)}</span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {shop.modifications.length > 6 && (
                            <button
                              onClick={() => toggleShowAllModifications(shop.shop_code)}
                              className="text-xs font-medium text-purple-600 dark:text-purple-300 hover:text-purple-700"
                            >
                              {showAllModifications[shop.shop_code] ? 'Скрыть варианты' : `Показать все (${shop.modifications.length})`}
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

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
    </>
  );

  if (displayMode === 'modal') {
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
              transition={{ type: 'spring', duration: 0.5 }}
              className={cardClasses}
            >
              {content}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
};

export default ProductModal;
