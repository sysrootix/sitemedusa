import { motion } from 'framer-motion'
import { Filter, Grid, List, Star } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api, { Product, Category, CatalogPagination } from '../services/api'

const Catalog = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortKey, setSortKey] = useState<'popular' | 'priceAsc' | 'priceDesc' | 'rating'>('popular')

  // Data states
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [pagination, setPagination] = useState<CatalogPagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Load data on component mount and when filters change
  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, sortKey, searchQuery, currentPage])

  const loadCategories = async () => {
    try {
      const data = await api.getProductCategories()
      setCategories([{ name: 'Все товары', count: data.reduce((sum, cat) => sum + cat.count, 0) }, ...data])
    } catch (err) {
      console.error('Failed to load categories:', err)
      toast.error('Не удалось загрузить категории', {
        icon: '📂',
      })
    }
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        page: currentPage,
        limit: 20,
      }

      // Add category filter
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }

      // Add search
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }

      // Add sorting
      let sortBy = 'name'
      let sortOrder: 'asc' | 'desc' = 'asc'

      switch (sortKey) {
        case 'priceAsc':
          sortBy = 'price'
          sortOrder = 'asc'
          break
        case 'priceDesc':
          sortBy = 'price'
          sortOrder = 'desc'
          break
        case 'popular':
        default:
          sortBy = 'name'
          sortOrder = 'asc'
          break
      }

      params.sortBy = sortBy
      params.sortOrder = sortOrder

      const data = await api.getProducts(params)
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError(api.handleApiError(err))
      toast.error('Не удалось загрузить товары', {
        icon: '📦',
      })
    } finally {
      setLoading(false)
    }
  }

  const categoryOptions = useMemo(() => [
    { id: 'all', name: 'Все товары', count: categories.reduce((sum, cat) => sum + cat.count, 0) },
    ...categories.map(cat => ({ id: cat.name, name: cat.name, count: cat.count }))
  ], [categories])

  const filteredProducts = products

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

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col lg:flex-row gap-8"
        >
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="lg:w-64 flex-shrink-0"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <Filter className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-300" />
                Категории
              </h3>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="space-y-2"
              >
                {categoryOptions.map((category, index) => (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 1.3 + 0.1 * index,
                      type: "spring",
                      stiffness: 120
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{category.count}</span>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Main */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex-1"
          >
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.4 }}
              className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6"
            >
              <div className="text-gray-600 dark:text-gray-300">
                Товаров: <span className="font-semibold text-gray-900 dark:text-white">{pagination?.total || 0}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm min-w-48"
                  aria-label="Поиск"
                />
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as any)}
                  className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm"
                  aria-label="Сортировка"
                >
                  <option value="popular">По популярности</option>
                  <option value="priceAsc">По цене (возрастание)</option>
                  <option value="priceDesc">По цене (убывание)</option>
                  <option value="rating">По рейтингу</option>
                </select>
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
                </div>
              </motion.div>

            {/* Products */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={() => loadProducts()}
                  className="mt-4 px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl"
                >
                  Попробовать снова
                </button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.6 }}
                className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
              >
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.6,
                      delay: 1.7 + 0.1 * index,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{
                      y: -5,
                      transition: { duration: 0.2 }
                    }}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 ${viewMode === 'list' ? 'flex' : ''}`}
                  >
                    <div className={`${viewMode === 'list' ? 'w-40 h-40' : 'aspect-square'} bg-gray-100 dark:bg-gray-700 rounded-l-2xl flex items-center justify-center`}>
                      <div className="w-20 h-20 bg-gray-900 dark:bg-white rounded-xl flex items-center justify-center">
                        <span className="text-white dark:text-gray-900 text-sm font-bold">{product.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className={`p-5 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{product.name}</h3>

                      {product.category_name && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{product.category_name}</p>
                      )}

                      <div className="mb-3 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Доступно в {product.shops.length} магазинах</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.shops.slice(0, 3).map((shop, shopIndex) => (
                            <span key={shopIndex} className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                              {shop.shop_name}: {shop.quantity} шт.
                            </span>
                          ))}
                          {product.shops.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                              +{product.shops.length - 3} ещё
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {product.min_price === product.max_price
                              ? `${product.min_price?.toLocaleString() || 'Цена не указана'} ₽`
                              : `${product.min_price?.toLocaleString() || 0} - ${product.max_price?.toLocaleString() || 0} ₽`
                            }
                          </span>
                        </div>
                        <button
                          className={`px-4 py-2 rounded-xl text-sm font-semibold ${product.total_quantity > 0 ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                          disabled={product.total_quantity <= 0}
                        >
                          {product.total_quantity > 0 ? 'В корзину' : 'Нет в наличии'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex justify-center mt-10">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Предыдущая
                  </button>

                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 rounded-xl ${
                          pageNum === currentPage
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                            : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                    disabled={currentPage === pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Следующая
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Catalog
