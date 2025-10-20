import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid, List, Package, SlidersHorizontal, Search, Heart, Star, ShoppingCart, X, Store } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { CatalogPagination } from '../services/api';
import CategoryBreadcrumbs from '../components/CategoryBreadcrumbs';
import CategoryCard from '../components/CategoryCard';
import ShopSelectorModal from '../components/ShopSelectorModal';
import CatalogFilters, { FilterOptions } from '../components/CatalogFilters';
import SkeletonLoader from '../components/SkeletonLoader';
import { useFavorites } from '../contexts/FavoritesContext';
import {
  buildProductUrl,
  buildCategoryUrl,
  parseCategoryUrl,
  buildCategoryPath,
  slugify,
  buildFallbackProductSlug
} from '../utils/catalogUrl';
import { checkCategoryRedirect, buildRedirectUrl } from '../utils/urlRedirects';

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

interface BreadcrumbItem {
  id: string;
  name: string;
  level: number;
  full_path?: string | null;
}

const CatalogHierarchicalV2 = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null);
  const [currentCategoryPath, setCurrentCategoryPath] = useState<string | null>(null);
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
  const [openingProductId, setOpeningProductId] = useState<string | null>(null);
  
  // New states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: null,
    maxPrice: null,
    inStockOnly: false,
    sortBy: null,
  });
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Parse URL to get search params
  const searchParams = new URLSearchParams(location.search);
  const pageParam = searchParams.get('page');
  const searchParam = searchParams.get('search');

  // Check for URL redirects on mount
  useEffect(() => {
    const categorySegments = parseCategoryUrl(location.pathname);

    if (categorySegments.length > 0) {
      const currentPath = categorySegments.join('/');
      const redirectedPath = checkCategoryRedirect(currentPath);

      if (redirectedPath) {
        // Old URL detected, redirect to new URL
        console.log('🔀 Redirecting from old URL:', currentPath, '→', redirectedPath);
        const newPathname = buildRedirectUrl(location.pathname, currentPath, redirectedPath);
        navigate(newPathname + location.search, { replace: true });
        return; // Stop execution to allow redirect
      }
    }
  }, []); // Run only once on mount

  // Initialize state from URL on mount
  useEffect(() => {
    const categorySegments = parseCategoryUrl(location.pathname);
    if (categorySegments.length > 0) {
      setCurrentCategoryPath(categorySegments.join('/'));
    } else {
      setCurrentCategoryPath(null);
    }

    if (searchParam) {
      setSearchQuery(searchParam);
    }
    if (pageParam) {
      setCurrentPage(parseInt(pageParam) || 1);
    }
  }, []); // Run only once on mount

  // Load shops on mount
  useEffect(() => {
    loadShops();
  }, []);

  // Sync state with URL changes (for browser back/forward buttons)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newSearchParam = params.get('search') || '';
    const newPageParam = params.get('page');
    const shopSelectorParamValue = params.get('shopSelector');

    const categorySegments = parseCategoryUrl(location.pathname);
    const newCategoryPath = categorySegments.length > 0 ? categorySegments.join('/') : null;
    if (newCategoryPath !== currentCategoryPath) {
      setCurrentCategoryPath(newCategoryPath);
    }

    if (newSearchParam !== searchQuery) {
      setSearchQuery(newSearchParam);
    }

    if (newPageParam) {
      const parsed = parseInt(newPageParam, 10);
      if (!Number.isNaN(parsed) && parsed !== currentPage) {
        setCurrentPage(parsed);
      }
    } else if (currentPage !== 1) {
      setCurrentPage(1);
    }

    if (shopSelectorParamValue === 'true') {
      if (!showShopSelector) {
        setShowShopSelector(true);
      }
    } else if (showShopSelector) {
      setShowShopSelector(false);
    }
  }, [location.pathname, location.search, currentCategoryPath, searchQuery, currentPage, showShopSelector]);

  // Resolve category path to category ID when path changes
  useEffect(() => {
    if (!currentCategoryPath) {
      setCurrentCategoryId(null);
      return;
    }
    
    // Load all categories to find the matching one
    const resolveCategoryPath = async () => {
      try {
        const allCategories = await api.getHierarchicalCategories();
        
        // Find category by matching the slugified full_path
        const targetPath = currentCategoryPath;
        const matchingCategory = allCategories.find(cat => {
          if (!cat.full_path) return false;
          const categorySlugPath = buildCategoryPath(cat.full_path).join('/');
          return categorySlugPath === targetPath;
        });
        
        if (matchingCategory) {
          setCurrentCategoryId(matchingCategory.id);
        } else {
          // Category not found, but don't redirect if we're showing a product
          console.warn('Category not found for path:', currentCategoryPath);
          // Just clear the category ID, but keep showing products
          setCurrentCategoryId(null);
        }
      } catch (err) {
        console.error('Failed to resolve category path:', err);
      }
    };
    
    resolveCategoryPath();
  }, [currentCategoryPath]);

  // Load categories or products based on current category
  useEffect(() => {
    if (searchQuery.trim()) {
      // If there's a search query, search products directly
      searchProducts();
    } else if (currentCategoryId) {
      loadCategoryDetails();
    } else {
      // Load all products by default instead of categories
      loadAllProducts();
    }
  }, [currentCategoryId, currentPage, selectedShop, searchQuery]);

  const loadShops = async () => {
    try {
      const shopsData = await api.getCatalogShops();
      setShops(shopsData);
    } catch (err) {
      console.error('Failed to load shops:', err);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      
      // Search products globally
      const params: any = {
        page: currentPage,
        limit: 20,
        search: searchQuery.trim(),
        shop_code: selectedShop || undefined,
        group_by_name: selectedShop === null,
      };

      // Use the global search API
      const productsData = await api.searchProductsGlobally(params);
      
      setCategories([]);
      setProducts(productsData.products || []);
      setPagination(productsData.pagination);
      setCatalogMode(productsData.mode || 'general');
      setBreadcrumbs([]);
    } catch (err) {
      console.error('Failed to search products:', err);
      toast.error('Не удалось найти товары', {
        icon: '🔍',
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllProducts = async () => {
    try {
      setLoading(true);
      
      // Load all products with pagination
      const params: any = {
        page: currentPage,
        limit: 20,
        shop_code: selectedShop || undefined,
        group_by_name: selectedShop === null,
      };

      // Load categories for the filter chips
      const categoriesData = await api.getHierarchicalCategories();
      setCategories(categoriesData);

      // Load all products
      const productsData = await api.searchProductsGlobally(params);
      
      setProducts(productsData.products || []);
      setPagination(productsData.pagination);
      setCatalogMode(productsData.mode || 'general');
      setBreadcrumbs([]);
    } catch (err) {
      console.error('Failed to load products:', err);
      toast.error('Не удалось загрузить товары', {
        icon: '📦',
      });
    } finally {
      setLoading(false);
    }
  };

  // Removed loadRootCategories - not used with hierarchical URLs
  // Root categories are loaded via loadAllProducts instead

  const loadCategoryDetails = async () => {
    if (!currentCategoryId) return;

    try {
      setLoading(true);

      // Load breadcrumbs
      const categoryDetails = await api.getCategoryByIdWithBreadcrumb(currentCategoryId);
      
      // Build full_path for each breadcrumb item
      const enrichedBreadcrumbs = categoryDetails.breadcrumb.map((item, index) => {
        // Build full path by joining all names up to current item
        const pathParts = categoryDetails.breadcrumb.slice(0, index + 1).map(b => b.name);
        const full_path = pathParts.join(' > ');
        return {
          ...item,
          full_path
        };
      });
      
      setBreadcrumbs(enrichedBreadcrumbs);

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
          search: searchQuery || undefined,
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

  const handleCategoryClick = (category: HierarchicalCategory) => {
    setCurrentCategoryId(category.id);
    setCurrentPage(1);
    setSearchQuery('');
    
    // Build and navigate to category URL
    const categoryUrl = buildCategoryUrl(category.full_path);
    navigate(categoryUrl);
  };

  const handleBreadcrumbNavigate = (categoryId: string | null, categoryPath?: string | null) => {
    setCurrentCategoryId(categoryId);
    setCurrentPage(1);
    setSearchQuery('');
    
    // Navigate to category URL or root
    if (categoryId && categoryPath) {
      const categoryUrl = buildCategoryUrl(categoryPath);
      navigate(categoryUrl);
    } else {
      navigate('/catalog');
    }
  };

  const handleShopChange = (shopCode: string | null) => {
    setSelectedShop(shopCode);
    setCurrentPage(1);
    setShowShopSelector(false);
    
    // Remove shopSelector parameter when closing
    const params = new URLSearchParams(location.search);
    params.delete('shopSelector');
    const newSearch = params.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  const handleOpenShopSelector = () => {
    setShowShopSelector(true);
    
    // Add shopSelector parameter to URL
    const params = new URLSearchParams(location.search);
    params.set('shopSelector', 'true');
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const handleCloseShopSelector = () => {
    setShowShopSelector(false);
    
    // Remove shopSelector parameter from URL
    const params = new URLSearchParams(location.search);
    params.delete('shopSelector');
    const newSearch = params.toString();
    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
  };

  // Removed handleQuickView - using full product modal instead

  const handleProductClick = async (product: any) => {
    if (openingProductId) {
      return;
    }

    const slugFromName = slugify(product.name);
    const fallbackSlug = product.id
      ? buildFallbackProductSlug(product.name, product.id)
      : slugFromName || product.id || 'product';
    const productSlug = product.slug || fallbackSlug;
    const loadingKey = product.id || productSlug;
    setOpeningProductId(loadingKey || null);

    let categoryPath = null;
    let resolvedSlug = productSlug;
    let productData: any | null = null;
    let resolvedProductId: string | null = product.id || null;

    if (product.characteristics?.full_path && typeof product.characteristics.full_path === 'string') {
      categoryPath = product.characteristics.full_path;
      console.log('📂 Using category path from product:', categoryPath);
    } else if (product.category_path && typeof product.category_path === 'string') {
      categoryPath = product.category_path;
      console.log('📂 Using category_path from product:', categoryPath);
    } else if (product.category_name && typeof product.category_name === 'string') {
      categoryPath = product.category_name;
      console.log('📂 Using category_name from product:', categoryPath);
    } else if (currentCategoryPath) {
      categoryPath = currentCategoryPath;
      console.log('📂 Falling back to current category path:', categoryPath);
    } else {
      console.log('⚠️ No category path found for product, using simple URL');
    }

    try {
      if (product.id) {
        productData = await api.getProductById(product.id);
      } else if (product.slug) {
        productData = await api.tryGetProductBySlug(product.slug);
      }

      if (productData?.product?.slug) {
        resolvedSlug = productData.product.slug;
      } else if (productData?.product?.id) {
        resolvedSlug = buildFallbackProductSlug(
          productData.product.name ?? product.name,
          productData.product.id
        );
      }

      if (productData?.product?.id) {
        resolvedProductId = productData.product.id;
      }

      if (!categoryPath && productData?.product) {
        const fromCharacteristics = productData.product.characteristics?.full_path;
        const fromCategoryPath = (productData.product as any)?.category_path;
        categoryPath =
          (typeof fromCharacteristics === 'string' && fromCharacteristics) ||
          (typeof fromCategoryPath === 'string' && fromCategoryPath) ||
          categoryPath;
      }

      const productUrl = buildProductUrl(resolvedSlug, categoryPath);
      console.log('🔗 Navigating to product URL:', productUrl);
      const navigationState = resolvedProductId ? { fallbackProductId: resolvedProductId } : undefined;
      navigate(productUrl, navigationState ? { state: navigationState } : undefined);
    } catch (error) {
      console.error('Failed to open product page:', error);
      toast.error('Не удалось открыть карточку товара');
    } finally {
      setOpeningProductId(null);
    }
  };
  // Apply filters and sorting to products
  const filteredAndSortedProducts = useMemo(() => {
    if (products.length === 0) return [];

    let filtered = [...products];

    // NOTE: Search filtering is done on backend with keyboard layout conversion
    // No need to filter by search query here, as backend already handled it

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
  }, [products, filters, catalogMode]); // searchQuery removed - filtering done on backend

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
    <div className="py-6 md:py-12 bg-white dark:bg-gray-900 min-h-screen">
      <div className="container-custom px-4 md:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 md:mb-8"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm mb-3"
          >
            <Package className="w-4 h-4 mr-2" />
            Каталог товаров
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
          >
            Найдите своё
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="text-sm md:text-lg text-gray-600 dark:text-gray-400"
          >
            Подберите идеальное устройство, жидкость или аксессуар
          </motion.p>
        </motion.div>

        {/* Search and Filters Bar - Mobile First */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 md:mb-6 sticky top-0 z-30 bg-white dark:bg-gray-900 py-3 -mx-4 px-4 md:mx-0 md:px-0 md:static shadow-md md:shadow-none"
        >
          <div className="flex flex-col gap-3">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Поиск по всему каталогу..."
                value={searchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchQuery(value);
                  setCurrentPage(1);
                  
                  // Update URL with search parameter
                  const params = new URLSearchParams(location.search);
                  if (value.trim()) {
                    params.set('search', value);
                  } else {
                    params.delete('search');
                  }
                  const newSearch = params.toString();
                  navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
                }}
                className="w-full pl-10 pr-4 py-3 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-base md:text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                    
                    // Remove search parameter from URL
                    const params = new URLSearchParams(location.search);
                    params.delete('search');
                    const newSearch = params.toString();
                    navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ''}`, { replace: true });
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Quick filters row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              {/* Shop selector */}
              <button
                onClick={handleOpenShopSelector}
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm whitespace-nowrap"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-medium">
                  {selectedShop 
                    ? (() => {
                        const shop = shops.find(s => s.shop_code === selectedShop);
                        return shop ? shop.city : selectedShop;
                      })()
                    : 'Все магазины'}
                </span>
              </button>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-sm whitespace-nowrap ${
                  showFilters
                    ? 'bg-purple-500 text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="font-medium">Фильтры</span>
              </button>

              {/* View mode toggle */}
              {products.length > 0 && (
                <div className="flex-shrink-0 flex border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
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
              )}
            </div>
          </div>
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
            className="mb-4 md:mb-6"
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
            className="mb-4 md:mb-6"
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

        {/* Filters - Now always visible when showFilters is true */}
        {/* Search results indicator */}
        {searchQuery.trim() && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <span>Результаты поиска:</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">"{searchQuery}"</span>
            {products.length > 0 && (
              <span className="text-gray-500 dark:text-gray-500">— найдено {products.length}</span>
            )}
          </motion.div>
        )}

        {/* Category Filter Chips - Horizontal Scroll */}
        {!currentCategoryId && categories.length > 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 md:mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Категории:</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
              <button
                onClick={() => {
                  setCurrentCategoryId(null);
                  setCurrentCategoryPath(null);
                  setCurrentPage(1);
                  navigate('/catalog');
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  !currentCategoryId
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-2 border-gray-900 dark:border-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white'
                }`}
              >
                Все товары
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-900 dark:hover:border-white"
                >
                  <div className="flex items-center gap-2">
                    <span>{category.name}</span>
                    {category.product_count > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {category.product_count}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {products.length > 0 && showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 md:mb-6"
          >
            <CatalogFilters
              filters={filters}
              onFiltersChange={setFilters}
              productCount={filteredAndSortedProducts.length}
            />
          </motion.div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonLoader 
              variant={categories.length > 0 && currentCategoryId ? 'category-card' : 'product-card'} 
              count={6} 
            />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {categories.length > 0 && currentCategoryId ? (
              // Show subcategories when inside a category
              <motion.div
                key="subcategories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="grid gap-3 md:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              >
                {categories.map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    id={category.id}
                    name={category.name}
                    productCount={category.product_count}
                    hasSubcategories={category.has_subcategories}
                    onClick={() => handleCategoryClick(category)}
                    index={index}
                  />
                ))}
              </motion.div>
            ) : products.length > 0 || filteredAndSortedProducts.length > 0 ? (
              // Show products
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                {/* Results count */}
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Найдено товаров: <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedProducts.length}</span>
                </div>

                <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                  {filteredAndSortedProducts.map((product, index) => {
                    const isOpening = openingProductId === product.id;
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: 0.03 * index,
                          type: "spring",
                          stiffness: 100
                        }}
                        className="group relative h-full"
                      >
                      <div 
                        onClick={() => handleProductClick(product)}
                        className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden h-full ${viewMode === 'list' ? 'flex' : 'flex flex-col'} ${isOpening ? 'pointer-events-none opacity-75' : 'cursor-pointer'}`}
                      >
                        {/* Product Image */}
                        <div className={`relative ${viewMode === 'list' ? 'w-32 md:w-40' : 'aspect-square'} bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-700 dark:via-gray-750 dark:to-gray-800 flex items-center justify-center overflow-hidden`}>
                          {/* Decorative gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-100/20 via-transparent to-blue-100/20 dark:from-purple-900/10 dark:to-blue-900/10" />
                          
                          <Package className="w-16 h-16 md:w-20 md:h-20 text-purple-300 dark:text-gray-500 relative z-0" />
                          
                          {/* Favorite button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(product.id, product.name, {
                                category_name: product.category_name,
                                price: product.price,
                                image_url: product.image_url
                              });
                            }}
                            className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                          >
                            <Heart 
                              className={`w-4 h-4 md:w-5 md:h-5 ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-400'}`} 
                            />
                          </button>

                          {/* Stock badge - more prominent */}
                          {catalogMode === 'shop' && product.quanty !== null && product.quanty <= 0 && (
                            <div className="absolute top-2 left-2 md:top-3 md:left-3 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg">
                              Нет в наличии
                            </div>
                          )}
                          
                          {/* In stock badge */}
                          {((catalogMode === 'shop' && product.quanty > 0) || 
                            (catalogMode === 'general' && product.total_quantity > 0)) && (
                            <div className="absolute top-2 left-2 md:top-3 md:left-3 px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-lg shadow-lg">
                              В наличии
                            </div>
                          )}

                          {isOpening && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
                              <div className="w-10 h-10 border-4 border-purple-400/70 border-t-transparent rounded-full animate-spin" />
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className={`p-4 md:p-5 flex flex-col flex-1 ${viewMode === 'list' ? '' : ''}`}>
                          {/* Product name */}
                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1.5 line-clamp-2 h-12">
                            {product.name}
                          </h3>

                          {/* Category - под названием, выделена */}
                          <div className="mb-3 inline-flex">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 rounded-md truncate max-w-full">
                              {product.category_name || product.characteristics?.full_path?.split(' > ')[0] || 'Без категории'}
                            </span>
                          </div>

                          {/* Shops availability info */}
                          {catalogMode === 'general' && product.available_shops_count > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <Store className="w-3.5 h-3.5" />
                              <span>
                                В {product.available_shops_count} {product.available_shops_count === 1 ? 'магазине' : product.available_shops_count < 5 ? 'магазинах' : 'магазинах'}
                              </span>
                              <span className="text-gray-400">•</span>
                              <span>{Math.round(product.total_quantity || 0)} шт.</span>
                            </div>
                          )}

                          {/* Shop specific stock */}
                          {catalogMode === 'shop' && product.quanty !== null && product.quanty > 0 && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-3">
                              <Package className="w-3.5 h-3.5" />
                              <span>Доступно: {Math.round(product.quanty)} шт.</span>
                            </div>
                          )}

                          {/* Price */}
                          <div className="mt-auto">
                            {catalogMode === 'general' && product.shops ? (
                              <div className="mb-3">
                                <div className="flex items-baseline gap-2">
                                  {product.min_price === product.max_price ? (
                                    <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                      {Math.round(product.min_price || 0).toLocaleString('ru-RU')} ₽
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-lg md:text-xl text-gray-600 dark:text-gray-400">от</span>
                                      <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(product.min_price || 0).toLocaleString('ru-RU')} ₽
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="mb-3">
                                {product.retail_price && (
                                  <span className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                                    {Math.round(product.retail_price).toLocaleString('ru-RU')} ₽
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Add to cart button - минималистичная белая */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Open product modal to select shop and modification
                              handleProductClick(product);
                            }}
                            disabled={
                              (catalogMode === 'general' && product.total_quantity <= 0) ||
                              (catalogMode === 'shop' && product.quanty <= 0)
                            }
                            className={`w-full px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                              ((catalogMode === 'general' && product.total_quantity > 0) ||
                              (catalogMode === 'shop' && product.quanty > 0))
                                ? 'bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900'
                                : 'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>
                              {((catalogMode === 'general' && product.total_quantity > 0) ||
                                (catalogMode === 'shop' && product.quanty > 0))
                                ? 'В корзину'
                                : 'Нет в наличии'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8 md:mt-10">
                    <div className="flex gap-2 flex-wrap justify-center">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm md:text-base"
                      >
                        Предыдущая
                      </button>

                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 md:px-4 py-2 rounded-xl transition-colors text-sm md:text-base ${
                              pageNum === currentPage
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
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
                        className="px-3 md:px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm md:text-base"
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
                className="text-center py-20"
              >
                <Package className="w-16 h-16 md:w-20 md:h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-2">
                  {searchQuery ? 'По вашему запросу ничего не найдено' : currentCategoryId ? 'В этой категории пока нет товаров' : 'Категории не найдены'}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                  >
                    Сбросить поиск
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default CatalogHierarchicalV2;
