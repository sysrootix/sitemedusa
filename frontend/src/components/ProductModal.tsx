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

  const isPageMode = displayMode === 'page';

  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { product, loading, error } = useProductDetails({
    productId,
    productSlug,
    enabled: isPageMode ? true : isOpen,
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

  const cardClasses = isPageMode
    ? 'relative w-full bg-white dark:bg-gray-900 rounded-3xl md:rounded-[28px] border border-gray-200/60 dark:border-gray-800 shadow-2xl overflow-hidden'
    : 'relative w-full max-w-5xl max-h-[95vh] md:max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl md:rounded-3xl shadow-2xl overflow-hidden';

  const scrollClasses = isPageMode
    ? ''
    : 'overflow-y-auto max-h-[95vh] md:max-h-[90vh]';

  const pageWrapperClasses = 'bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen';
  const pageContainerClasses = 'container-custom px-4 md:px-6 py-8 md:py-12';

  const modalTopActions = !isPageMode ? (
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

  const pageTopbar = isPageMode ? (
    <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200 dark:border-gray-800/80 bg-white/85 dark:bg-gray-900/85 backdrop-blur">
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
  ) : null;

  const formatShopCount = (count: number) => {
    if (count === 1) return 'магазин';
    if (count >= 2 && count <= 4) return 'магазина';
    return 'магазинов';
  };
  const renderCategoryChips = () => {
    if (!product || !isPageMode) {
      return null;
    }

    const rawPath =
      (typeof product.product.characteristics?.full_path === 'string' && product.product.characteristics.full_path) ||
      (typeof (product.product as any)?.category_path === 'string' && (product.product as any).category_path) ||
      product.product.category_name;

    if (!rawPath || typeof rawPath !== 'string') {
      return null;
    }

    const parts = rawPath
      .split(/>|\/+/)
      .map(part => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-wrap items-center gap-2">
        {parts.map((part, index) => (
          <span
            key={`${part}-${index}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              index === parts.length - 1
                ? 'bg-purple-600 text-white dark:bg-purple-500 dark:text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {part}
          </span>
        ))}
      </div>
    );
  };

  const favoriteButton = product ? (
    <button
      onClick={() => toggleFavorite(product.product.id, product.product.name, {
        category_name: product.product.category_name,
        price: product.product.price,
        image_url: product.product.image_url,
      })}
      className={`${isPageMode
        ? 'p-2.5 md:p-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/40 shadow-sm'
        : 'p-1.5 md:p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
      } transition-colors flex items-center justify-center shrink-0`}
    >
      <Heart
        className={`w-5 h-5 md:w-6 md:h-6 shrink-0 ${isFavorite(product.product.id) ? 'fill-red-500 text-red-500' : isPageMode ? 'text-purple-600 dark:text-purple-200' : 'text-gray-700 dark:text-gray-300'}`}
      />
    </button>
  ) : null;

  const renderPriceSummary = (layout: 'modal' | 'page') => {
    if (!product) return null;

    const minPrice = Math.round(product.min_price || 0).toLocaleString('ru-RU');
    const maxPrice = Math.round(product.max_price || 0).toLocaleString('ru-RU');
    const samePrice = Math.round(product.min_price || 0) === Math.round(product.max_price || 0);
    const totalQty = Math.max(0, Math.round(product.total_quantity || 0));
    const availableShopsCount = product.shops ? product.shops.filter(shop => shop.available).length : 0;

    const wrapperSpacing = layout === 'page' ? 'space-y-4' : 'space-y-3';
    const priceWrapperClass = layout === 'page'
      ? 'inline-flex items-baseline gap-2 rounded-2xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 shadow-sm'
      : 'inline-flex items-baseline gap-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2.5 shadow-sm';
    const sameValueClass = layout === 'page' ? 'text-4xl font-bold tracking-tight' : 'text-2xl md:text-3xl font-bold tracking-tight';
    const rangeValueClass = layout === 'page' ? 'text-3xl font-bold tracking-tight' : 'text-xl md:text-2xl font-bold tracking-tight';
    const currencyClass = layout === 'page' ? 'text-base font-medium opacity-80' : 'text-sm font-medium opacity-80';
    const labelClass = layout === 'page'
      ? 'text-sm font-semibold uppercase tracking-wide opacity-70'
      : 'text-xs font-semibold uppercase tracking-wide opacity-70';
    const chipBase = layout === 'page'
      ? 'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium'
      : 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium';
    const iconSize = layout === 'page' ? 'w-4 h-4' : 'w-3.5 h-3.5';

    const availabilityChipClass = `${chipBase} ${totalQty > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-200'}`;
    const shopsChipClass = `${chipBase} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200`;
    const availabilityLabel = totalQty > 0 ? `В наличии: ${totalQty} шт.` : 'Нет в наличии';
    const shopsLabel = availableShopsCount > 0 ? `${availableShopsCount} ${formatShopCount(availableShopsCount)}` : 'Наличие уточняется';

    return (
      <div className={wrapperSpacing}>
        <div className={priceWrapperClass}>
          {samePrice ? (
            <>
              <span className={sameValueClass}>{minPrice}</span>
              <span className={currencyClass}>₽</span>
            </>
          ) : (
            <>
              <span className={labelClass}>от</span>
              <span className={rangeValueClass}>{minPrice}</span>
              <span className={currencyClass}>₽</span>
              <span className={labelClass}>до</span>
              <span className={rangeValueClass}>{maxPrice}</span>
              <span className={currencyClass}>₽</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className={availabilityChipClass}>
            <Package className={iconSize} />
            <span>{availabilityLabel}</span>
          </div>
          {product.shops && product.shops.length > 0 && (
            <div className={shopsChipClass}>
              <Store className={iconSize} />
              <span>{shopsLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCharacteristicsSection = (layout: 'modal' | 'page') => {
    if (
      !product?.product?.characteristics ||
      Object.keys(product.product.characteristics).length === 0
    ) {
      return null;
    }

    if (layout === 'page') {
      return null;
    }

    return (
      <div className="mb-4 p-3 md:p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-blue-100 dark:border-gray-600">
        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          Категория
        </h3>
        <div className="space-y-2 overflow-x-auto">
          {Object.entries(product.product.characteristics).map(([key, value]) => {
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
    );
  };

  const renderDescriptionSection = (layout: 'modal' | 'page') => {
    const description = product?.product?.characteristics?.description;
    if (!description) {
      return null;
    }

    const wrapperClass = layout === 'page'
      ? 'rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 p-6 md:p-8'
      : 'mt-6 md:mt-8';
    const headingClass = layout === 'page'
      ? 'text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-4'
      : 'text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-3';
    const proseClass = layout === 'page'
      ? 'prose prose-sm md:prose-lg prose-gray max-w-none dark:prose-invert'
      : 'prose prose-sm md:prose-base prose-gray max-w-none dark:prose-invert';

    return (
      <section className={wrapperClass}>
        <h2 className={headingClass}>Описание</h2>
        <div className={proseClass}>
          <p>{description}</p>
        </div>
      </section>
    );
  };

  const renderShopsSection = (layout: 'modal' | 'page') => {
    if (!product?.shops || product.shops.length === 0) {
      return null;
    }

    const sectionClass = layout === 'page' ? 'space-y-4' : 'mt-6 md:mt-8 space-y-3';
    const headingClass = layout === 'page'
      ? 'text-xl md:text-2xl font-semibold text-gray-900 dark:text-white'
      : 'text-lg md:text-xl font-semibold text-gray-900 dark:text-white';
    const listWrapperClass = layout === 'page' ? 'space-y-3 md:space-y-4' : 'space-y-3';
    const cardClass = layout === 'page'
      ? 'p-5 md:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/80 shadow-sm hover:shadow-lg transition-all'
      : 'p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors';
    const iconWrapperClass = layout === 'page'
      ? 'w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center'
      : 'w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center';
    const cityClass = layout === 'page'
      ? 'text-base md:text-lg font-semibold text-gray-900 dark:text-white'
      : 'text-sm md:text-base font-semibold text-gray-900 dark:text-white';
    const addressClass = layout === 'page'
      ? 'text-sm md:text-base text-gray-500 dark:text-gray-400'
      : 'text-xs md:text-sm text-gray-500 dark:text-gray-400';
    const availabilityBase = layout === 'page' ? 'text-sm md:text-base font-medium' : 'text-xs md:text-sm font-medium';
    const priceClass = layout === 'page'
      ? 'text-lg font-semibold text-gray-900 dark:text-white'
      : 'text-sm md:text-base font-semibold text-gray-900 dark:text-white';
    const buttonClass = layout === 'page'
      ? 'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all'
      : 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-sm transition-colors';

    return (
      <section className={sectionClass} id={layout === 'page' ? 'shop-list' : undefined}>
        <h2 className={headingClass}>{layout === 'page' ? 'Наличие в магазинах' : 'Выберите магазин'}</h2>
        <div className={listWrapperClass}>
          {product.shops.map(shop => {
            const availabilityClass = `${availabilityBase} ${shop.available ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`;
            const cardKey = `${shop.shop_code}-${layout}`;

            return (
              <motion.div key={cardKey} layout className={cardClass}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={iconWrapperClass}>
                      <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                    </div>
                    <div>
                      <div className={cityClass}>{shop.city}</div>
                      <div className={addressClass}>{shop.address}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={availabilityClass}>
                      {shop.available ? 'В наличии' : 'Нет в наличии'}
                    </div>
                    <div className={priceClass}>
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
                      className={buttonClass}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Добавить</span>
                    </button>
                  </div>
                </div>

                {shop.modifications && shop.modifications.length > 0 && (
                  <div className={`mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2 ${layout === 'page' ? 'md:pt-4 md:space-y-3' : ''}`}>
                    <div className={`${layout === 'page' ? 'text-sm font-medium text-gray-600 dark:text-gray-400' : 'text-xs font-medium text-gray-600 dark:text-gray-400'}`}>
                      Выберите вариант:
                    </div>
                    <div className={`flex flex-wrap gap-2 ${layout === 'page' ? 'md:gap-3' : ''}`}>
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
                            className={`px-3 py-1.5 rounded-full border text-xs transition-all ${layout === 'page' ? 'md:px-4 md:py-2 md:text-sm' : ''} ${
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
            );
          })}
        </div>
      </section>
    );
  };

  const renderNotFoundState = (layout: 'modal' | 'page') => (
    <div className={layout === 'page' ? 'py-12 text-center text-gray-600 dark:text-gray-300' : 'p-8 text-center text-gray-600 dark:text-gray-400'}>
      Товар не найден
    </div>
  );

  const renderModalBody = () => {
    if (loading) {
      return <SkeletonLoader variant="product-modal" count={1} />;
    }

    if (!product) {
      return renderNotFoundState('modal');
    }

    return (
      <div className="p-4 md:p-6 space-y-6 md:space-y-8">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
            <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-700 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Package className="w-10 h-10 md:w-16 md:h-16 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="flex-1 space-y-4 text-left">
              <div className="space-y-2">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {product.product.name}
                </h2>
                {renderCategoryChips()}
              </div>
              {renderPriceSummary('modal')}
            </div>
          </div>
        </div>
        {renderCharacteristicsSection('modal')}
        {renderShopsSection('modal')}
        {renderDescriptionSection('modal')}
      </div>
    );
  };

  const renderPageBody = () => {
    if (loading) {
      return (
        <div className="py-24 flex justify-center">
          <SkeletonLoader variant="product-modal" count={1} />
        </div>
      );
    }

    if (!product) {
      return renderNotFoundState('page');
    }

    return (
      <div className="space-y-16">
        <section className="grid gap-10 md:gap-12 md:grid-cols-[minmax(0,420px)_1fr] items-start">
          <div className="relative w-full max-w-md mx-auto md:mx-0 aspect-square rounded-3xl bg-gradient-to-br from-purple-500/20 via-purple-600/10 to-purple-400/20 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center shadow-[0_25px_60px_-20px_rgba(79,70,229,0.45)]">
            <div className="absolute inset-0 rounded-3xl border border-purple-500/20 dark:border-purple-400/20" />
            <Package className="relative z-10 w-20 h-20 md:w-28 md:h-28 text-purple-500/80 dark:text-purple-300/70" />
            {favoriteButton && (
              <div className="absolute top-4 right-4 md:top-6 md:right-6">
                {favoriteButton}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-8">
            <div className="space-y-5">
              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                {product.product.name}
              </h1>
              {renderCategoryChips()}
              {renderPriceSummary('page')}
            </div>
          </div>
        </section>
        {renderShopsSection('page')}
        {renderDescriptionSection('page')}
      </div>
    );
  };

  if (isPageMode) {
    return (
      <div className={pageWrapperClasses}>
        {pageTopbar}
        <div className={pageContainerClasses}>
          {renderPageBody()}
        </div>
      </div>
    );
  }

  const modalContent = (
    <>
      {modalTopActions}
      <div className={scrollClasses}>
        {renderModalBody()}
      </div>
    </>
  );

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
            {modalContent}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductModal;
