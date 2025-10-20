import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Button } from '@/shared/ui'
import api from '@/services/api'
import toast from 'react-hot-toast'
import { buildProductUrl, slugify, buildFallbackProductSlug } from '@/utils/catalogUrl'

interface PopularProduct {
  id: string
  name: string
  category: string
  total_sold: number
  purchase_count: number
  price: number
  min_price: number
  max_price: number
  in_stock: boolean
  stock_quantity: number
}

const PopularProductsBlock = () => {
  const [products, setProducts] = useState<PopularProduct[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadPopularProducts()
  }, [])

  const handleProductClick = async (product: PopularProduct) => {
    try {
      const productData = await api.getProductById(product.id)
      const productSlug = productData.product.slug
        ? productData.product.slug
        : productData.product.id
          ? buildFallbackProductSlug(productData.product.name, productData.product.id)
          : slugify(productData.product.name) || product.id

      let categoryPath: string | null = null
      if (productData.product.characteristics?.full_path && typeof productData.product.characteristics.full_path === 'string') {
        categoryPath = productData.product.characteristics.full_path
      } else if (productData.product.category_path && typeof productData.product.category_path === 'string') {
        categoryPath = productData.product.category_path
      } else if (product.category && typeof product.category === 'string') {
        categoryPath = product.category
      }

      const productUrl = buildProductUrl(productSlug, categoryPath)
      if (productData.product.id) {
        navigate(productUrl, { state: { fallbackProductId: productData.product.id } })
      } else {
        navigate(productUrl)
      }
    } catch (error) {
      console.error('Failed to open product page:', error)
      toast.error('Не удалось открыть карточку товара')
    }
  }

  const loadPopularProducts = async () => {
    try {
      setLoading(true)
      const data = await api.getPopularProducts(3)
      setProducts(data)
    } catch (error) {
      console.error('Failed to load popular products:', error)
      // Fallback to empty array on error
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Calculate badge and color based on sales data
  const getProductBadge = (product: PopularProduct, index: number) => {
    if (index === 0) {
      return { text: 'Хит продаж', color: 'bg-purple-600' }
    } else if (product.total_sold > 50) {
      return { text: 'Популярное', color: 'bg-gray-800' }
    } else {
      return { text: 'Выбор покупателей', color: 'bg-purple-700' }
    }
  }

  // Generate rating based on purchase count (higher purchase count = higher rating)
  const calculateRating = (purchase_count: number) => {
    // Map purchase count to rating (4.5 to 5.0)
    const baseRating = 4.5
    const bonus = Math.min(purchase_count / 200, 0.5)
    return Math.round((baseRating + bonus) * 10) / 10
  }

  if (loading) {
    return (
      <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
        <div className="container-custom">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 border-t-purple-600 rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Загружаем популярные товары...</p>
          </div>
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null // Don't show section if no products
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-display mb-4 sm:mb-6 text-gray-900 dark:text-white">
            Популярные <span className="text-purple-600 dark:text-purple-400">товары</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4 sm:px-0">
            Самые востребованные устройства с отличными отзывами покупателей
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {products.map((product, index) => {
            const badge = getProductBadge(product, index)
            const rating = calculateRating(product.purchase_count)
            const price = Math.round(product.price)
            
            return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl transition-all duration-500 border border-gray-200/50 dark:border-gray-700/50 hover:border-purple-300/50 dark:hover:border-purple-500/50">
                {/* Image */}
                <div className="relative aspect-square bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-gray-700 dark:to-gray-600 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 via-transparent to-purple-600/10"></div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl"
                    >
                      <span className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">
                        {product.name.split(' ')[0].substring(0, 2).toUpperCase()}
                      </span>
                    </motion.div>
                  </div>

                  {/* Enhanced Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="absolute top-3 left-3 sm:top-4 sm:left-4"
                  >
                    <div className={`${badge.color} text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold shadow-lg border border-white/20 backdrop-blur-sm`}>
                      {badge.text}
                    </div>
                  </motion.div>

                  {/* Hover overlay - только на больших экранах */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 md:p-8">
                  <h3 className="text-lg sm:text-xl md:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300 leading-tight">
                    {product.name}
                  </h3>

                  {/* Rating */}
                  <div className="flex items-center mb-4 sm:mb-6">
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
                        >
                          <Star
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              i < Math.floor(rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </motion.div>
                      ))}
                      <span className="ml-2 sm:ml-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{rating}</span>
                    </div>
                    <span className="mx-2 sm:mx-3 text-gray-300 dark:text-gray-600">•</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{product.purchase_count} покупок</span>
                  </div>

                  {/* Pricing */}
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-0">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center">
                        <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {price.toLocaleString('ru-RU')}&nbsp;₽
                        </span>
                      </div>
                    </div>

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full sm:w-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={`px-4 py-2 rounded-xl text-sm font-semibold w-full sm:w-auto min-h-[40px] ${
                          product.in_stock 
                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                        disabled={!product.in_stock}
                      >
                        {product.in_stock ? 'В корзину' : 'Нет в наличии'}
                      </button>
                    </motion.div>
                  </div>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
              </div>
            </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8 sm:mt-12"
        >
          <Link to="/catalog">
            <Button
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="group relative bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 hover:from-purple-700 hover:via-purple-800 hover:to-purple-900 text-white shadow-lg overflow-hidden px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] w-full sm:w-auto max-w-xs sm:max-w-none mx-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <span className="relative z-10 text-sm sm:text-base">Смотреть весь каталог</span>
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

export default PopularProductsBlock
