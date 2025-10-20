import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid, List, Package, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { CatalogPagination } from '../services/api';
import CategoryBreadcrumbs from '../components/CategoryBreadcrumbs';
import CategoryCard from '../components/CategoryCard';
import ShopSelectorModal from '../components/ShopSelectorModal';
import ProductModal from '../components/ProductModal';
import CatalogFilters, { FilterOptions } from '../components/CatalogFilters';

interface HierarchicalCategory {
  id: string;
  shop_code: string;
  name: string;
  parent_id: string | null;
  level: number;
  full_path: string | null;
  product_count: number;
  has_subcategories: boolean;
  sort_order: number;
}

interface CategoryProduct {
  id: string;
  shop_code: string;
  category_id: string;
  name: string;
  quanty: number | null;
  retail_price: number | null;
  characteristics: any;
  modifications: any;
}

interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
}

const CatalogHierarchical = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<HierarchicalCategory[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [pagination, setPagination] = useState<CatalogPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [shops, setShops] = useState<Array<{ shop_code: string; shop_name: string; city: string; address: string; product_count: number }>>([]);
  const [showShopSelector, setShowShopSelector] = useState(false);
  const [catalogMode, setCatalogMode] = useState<'general' | 'shop'>('general');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    sortBy: null,
  });
  const [selectedModifications, setSelectedModifications] = useState<{[productId: string]: string}>({});

  // Load shops on mount
  useEffect(() => {
    loadShops();
  }, []);

  // Sync state with URL changes (for browser back/forward buttons)
  useEffect(() => {
    const shopSelectorParam = searchParams.get('shopSelector');
    
    // Update shop selector modal if URL changed
    if (shopSelectorParam === 'true') {
      if (!showShopSelector) {
        setShowShopSelector(true);
      }
    } else {
      if (showShopSelector) {
        setShowShopSelector(false);
      }
    }
  }, [searchParams]);

  // Load categories or products based on current category
  useEffect(() => {
    if (currentCategoryId) {
      loadCategoryDetails();
    } else {
      loadRootCategories();
    }
  }, [currentCategoryId, currentPage, selectedShop]);

  const loadShops = async () => {
    try {
      const shopsData = await api.getCatalogShops();
      setShops(shopsData);
    } catch (err) {
      console.error('Failed to load shops:', err);
    }
  };

  const loadRootCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await api.getHierarchicalCategories();
      setCategories(categoriesData);
      setProducts([]);
      setBreadcrumbs([]);
    } catch (err) {
      console.error('Failed to load root categories:', err);
      toast.error('Не удалось загрузить категории', {
        icon: '📂',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDetails = async () => {
    if (!currentCategoryId) return;

    try {
      setLoading(true);

      // Load breadcrumbs
      const categoryDetails = await api.getCategoryByIdWithBreadcrumb(currentCategoryId);
      setBreadcrumbs(categoryDetails.breadcrumb);

      // Try to load subcategories
      const subcategoriesData = await api.getHierarchicalCategories({
        parent_id: currentCategoryId,
      });

      if (subcategoriesData.length > 0) {
        // Has subcategories - show them
        setCategories(subcategoriesData);
        setProducts([]);
      } else {
        // No subcategories - load products
        setCategories([]);
        const productsData = await api.getProductsByCategoryId(currentCategoryId, {
          page: currentPage,
          limit: 20,
          shop_code: selectedShop || undefined,
          group_by_name: selectedShop === null,
        });
        setProducts(productsData.products);
        setPagination(productsData.pagination);
        setCatalogMode(productsData.mode);
      }
    } catch (err) {
      console.error('Failed to load category details:', err);
      toast.error('Не удалось загрузить данные категории', {
        icon: '📂',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setCurrentCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handleBreadcrumbNavigate = (categoryId: string | null) => {
    setCurrentCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handleShopChange = (shopCode: string | null) => {
    setSelectedShop(shopCode);
    setCurrentPage(1);
    setShowShopSelector(false);
    
    // Remove shopSelector parameter from URL when closing
    setSearchParams({});
  };

  const handleOpenShopSelector = () => {
    setShowShopSelector(true);
    
    // Add shopSelector parameter to URL
    setSearchParams({ shopSelector: 'true' });
  };

  const handleCloseShopSelector = () => {
    setShowShopSelector(false);
    
    // Remove shopSelector parameter from URL
    setSearchParams({});
  };

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    setShowProductModal(true);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setSelectedProductId(null);
  };

  // Apply filters and sorting to products
  const filteredAndSortedProducts = useMemo(() => {
    if (products.length === 0) return [];

    let filtered = [...products];

    // Filter by price
    if (filters.minPrice !== null) {
      filtered = filtered.filter(p => {
        const price = catalogMode === 'general' ? p.min_price : p.retail_price;
        return price && price >= filters.minPrice!;
      });
    }

    if (filters.maxPrice !== null) {
      filtered = filtered.filter(p => {
        const price = catalogMode === 'general' ? p.max_price : p.retail_price;
        return price && price <= filters.maxPrice!;
      });
    }

    // Filter by stock
    if (filters.inStockOnly) {
      filtered = filtered.filter(p => {
        if (catalogMode === 'general') {
          return p.total_quantity && p.total_quantity > 0;
        } else {
          return p.quanty && p.quanty > 0;
        }
      });
    }

    // Sort
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price-asc': {
            const priceA = catalogMode === 'general' ? a.min_price : a.retail_price;
            const priceB = catalogMode === 'general' ? b.min_price : b.retail_price;
            return (priceA || 0) - (priceB || 0);
          }
          
          case 'price-desc': {
            const priceA = catalogMode === 'general' ? a.max_price : a.retail_price;
            const priceB = catalogMode === 'general' ? b.max_price : b.retail_price;
            return (priceB || 0) - (priceA || 0);
          }
          
          case 'name-asc':
            return a.name.localeCompare(b.name, 'ru');
          
          case 'name-desc':
            return b.name.localeCompare(a.name, 'ru');
          
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [products, filters, catalogMode]);

  // Reset filters when category changes
  useEffect(() => {
    setFilters({
      minPrice: null,
      maxPrice: null,
      inStockOnly: false,
      sortBy: null,
    });
  }, [currentCategoryId]);

  return (
    <div className="py-12 bg-white dark:bg-gray-900 min-h-screen">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm mb-3"
          >
            Каталог товаров
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
          >
            Найдите своё
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-base md:text-lg text-gray-600 dark:text-gray-400 mt-2"
          >
            Подберите идеальное устройство, жидкость или аксессуар
          </motion.p>
        </motion.div>

        {/* Shop Filter Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <button
            onClick={handleOpenShopSelector}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium">
              {selectedShop 
                ? (() => {
                    const shop = shops.find(s => s.shop_code === selectedShop);
                    return shop ? `${shop.city} • ${shop.address}` : selectedShop;
                  })()
                : 'Все магазины'}
            </span>
          </button>
        </motion.div>

        {/* Shop Selector Modal */}
        <ShopSelectorModal
          shops={shops}
          selectedShop={selectedShop}
          onSelectShop={handleShopChange}
          isOpen={showShopSelector}
          onClose={handleCloseShopSelector}
        />

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <CategoryBreadcrumbs
              breadcrumbs={breadcrumbs}
              onNavigate={handleBreadcrumbNavigate}
            />
          </motion.div>
        )}

        {/* Back button (alternative to breadcrumbs) */}
        {currentCategoryId && breadcrumbs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <button
              onClick={() => handleBreadcrumbNavigate(null)}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Назад к категориям</span>
            </button>
          </motion.div>
        )}

        {/* View mode toggle (only for products) */}
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-end mb-6"
          >
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
                aria-label="Сетка"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
                aria-label="Список"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {categories.length > 0 ? (
              <>
                {/* Show categories */}
                <motion.div
                  key="categories"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                >
                  {categories.map((category, index) => (
                    <CategoryCard
                      key={category.id}
                      id={category.id}
                      name={category.name}
                      productCount={category.product_count}
                      hasSubcategories={category.has_subcategories}
                      onClick={() => handleCategoryClick(category.id)}
                      index={index}
                    />
                  ))}
                </motion.div>

                {/* Show "All Products" button if in a category */}
                {currentCategoryId && !showAllProducts && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={() => {
                        setShowAllProducts(true);
                        loadCategoryDetails(currentCategoryId, 1, selectedShop);
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Package className="w-5 h-5" />
                      Показать все товары категории
                    </button>
                  </motion.div>
                )}
              </>
            ) : products.length > 0 ? (
              // Show products
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Filters */}
                <CatalogFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  productCount={filteredAndSortedProducts.length}
                />

                <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredAndSortedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 30, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.05 * index,
                        type: "spring",
                        stiffness: 100
                      }}
                      whileHover={{
                        y: -5,
                        transition: { duration: 0.2 }
                      }}
                      className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 ${viewMode === 'list' ? 'flex' : ''}`}
                    >
                      <div className={`${viewMode === 'list' ? 'w-40 h-40' : 'aspect-square'} bg-gray-100 dark:bg-gray-700 rounded-t-2xl ${viewMode === 'list' ? 'rounded-l-2xl rounded-tr-none' : ''} flex items-center justify-center`}>
                        <div className="w-20 h-20 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
                          <Package className="w-10 h-10 text-white dark:text-gray-900" />
                        </div>
                      </div>
                      <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {product.name}
                        </h3>

                        {/* Price display */}
                        {catalogMode === 'general' && product.shops ? (
                          <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                              {product.min_price === product.max_price ? (
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                  {Math.round(product.min_price || 0).toLocaleString('ru-RU')} ₽
                                </span>
                              ) : (
                                <>
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(product.min_price || 0).toLocaleString('ru-RU')}
                                  </span>
                                  <span className="text-lg text-gray-500 dark:text-gray-400">—</span>
                                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(product.max_price || 0).toLocaleString('ru-RU')} ₽
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Доступно в {product.available_shops_count} {product.available_shops_count === 1 ? 'магазине' : 'магазинах'}
                            </div>
                          </div>
                        ) : (
                          <div className="mb-3">
                            {product.retail_price && (
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                {Math.round(product.retail_price).toLocaleString('ru-RU')} ₽
                              </span>
                            )}
                          </div>
                        )}

                        {/* Stock display */}
                        {catalogMode === 'shop' && product.quanty !== null && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {product.quanty > 0 ? (
                              <span className="text-green-600 dark:text-green-400">
                                В наличии: {Math.round(product.quanty)} шт.
                              </span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">
                                Нет в наличии
                              </span>
                            )}
                          </div>
                        )}

                        {catalogMode === 'general' && product.total_quantity !== undefined && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="text-green-600 dark:text-green-400">
                              Всего в наличии: {Math.round(product.total_quantity)} шт.
                            </span>
                          </div>
                        )}

                        {/* Action buttons - different logic for shop with modifications */}
                        {catalogMode === 'shop' && product.modifications && product.modifications.length > 0 && product.quanty > 0 ? (
                          <div>
                            {/* Modification selector */}
                            <select
                              value={selectedModifications[product.id] || ''}
                              onChange={(e) => setSelectedModifications({
                                ...selectedModifications,
                                [product.id]: e.target.value
                              })}
                              className="w-full px-4 py-2 mb-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Выберите вариант</option>
                              {product.modifications.map((mod: any) => (
                                <option key={mod.id} value={mod.id}>
                                  {mod.name} {mod.retail_price ? `— ${Math.round(mod.retail_price).toLocaleString('ru-RU')} ₽` : ''}
                                </option>
                              ))}
                            </select>
                            
                            {/* Add to cart button */}
                            <button
                              onClick={() => {
                                if (!selectedModifications[product.id]) {
                                  toast.error('Пожалуйста, выберите вариант товара', {
                                    icon: '📦',
                                  });
                                  return;
                                }
                                const selectedMod = product.modifications.find((m: any) => m.id === selectedModifications[product.id]);
                                toast.success(`${selectedMod?.name || 'Товар'} добавлен в корзину`, {
                                  icon: '🛒',
                                });
                              }}
                              disabled={!selectedModifications[product.id]}
                              className={`w-full px-4 py-2 rounded-xl text-sm font-semibold ${
                                selectedModifications[product.id]
                                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              В корзину
                            </button>
                          </div>
                        ) : (
                          // Regular button for products without modifications or in general mode
                          <button
                            onClick={() => {
                              if (catalogMode === 'general') {
                                handleProductClick(product.id);
                              } else {
                                toast.success('Товар добавлен в корзину', {
                                  icon: '🛒',
                                });
                              }
                            }}
                            className={`w-full px-4 py-2 rounded-xl text-sm font-semibold ${
                              (catalogMode === 'general' && product.total_quantity > 0) ||
                              (catalogMode === 'shop' && product.quanty > 0)
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                            }`}
                            disabled={
                              (catalogMode === 'general' && product.total_quantity <= 0) ||
                              (catalogMode === 'shop' && product.quanty <= 0)
                            }
                          >
                            {((catalogMode === 'general' && product.total_quantity > 0) ||
                              (catalogMode === 'shop' && product.quanty > 0))
                              ? catalogMode === 'general' ? 'Посмотреть' : 'В корзину'
                              : 'Нет в наличии'}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-10">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Предыдущая
                      </button>

                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-4 py-2 rounded-xl transition-colors ${
                              pageNum === currentPage
                                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Следующая
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              // No data
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Package className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {currentCategoryId ? 'В этой категории пока нет товаров' : 'Категории не найдены'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Product Modal */}
        {selectedProductId && (
          <ProductModal
            productId={selectedProductId}
            isOpen={showProductModal}
            onClose={handleCloseProductModal}
          />
        )}
      </div>
    </div>
  );
};

export default CatalogHierarchical;

