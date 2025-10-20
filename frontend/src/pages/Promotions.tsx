import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { Gift, Calendar, ArrowRight, Sparkles, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import Modal from '@/shared/ui/Modal'

interface Promotion {
  id: string
  title: string
  description: string
  image_url?: string
  starts_at: string
  ends_at?: string
  created_at: string
  updated_at: string
}

const Promotions = () => {
  const { isAuthenticated } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await fetch('/api/promotions/active')
        const data = await response.json()

        if (data.success) {
          setPromotions(data.data)
        } else {
          setError('Не удалось загрузить акции')
        }
      } catch (err) {
        setError('Ошибка при загрузке акций')
        console.error('Error fetching promotions:', err)
        toast.error('Ошибка при загрузке акций', {
          duration: 4000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '1px solid #f59e0b',
          },
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPromotions()
  }, [])

  // Sync modal state with URL
  useEffect(() => {
    const promotionParam = searchParams.get('promotion')
    
    if (promotionParam) {
      const promotion = promotions.find(p => p.id === promotionParam)
      if (promotion && !isModalOpen) {
        setSelectedPromotion(promotion)
        setIsModalOpen(true)
      }
    } else {
      if (isModalOpen) {
        setIsModalOpen(false)
        setSelectedPromotion(null)
      }
    }
  }, [searchParams, promotions])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const isPromotionActive = (endsAt?: string) => {
    if (!endsAt) return true
    return new Date(endsAt) > new Date()
  }

  const openPromotionModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion)
    setIsModalOpen(true)
    // Add promotion parameter to URL
    setSearchParams({ promotion: promotion.id })
  }

  const closePromotionModal = () => {
    setIsModalOpen(false)
    setSelectedPromotion(null)
    // Remove promotion parameter from URL
    setSearchParams({})
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container-custom py-20">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Gift className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Загружаем акции...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Проверяем актуальные предложения
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <div className="container-custom py-20">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ошибка загрузки
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-200"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-200/20 to-pink-200/20 dark:from-purple-900/10 dark:to-pink-900/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-200/20 to-purple-200/20 dark:from-blue-900/10 dark:to-purple-900/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative container-custom py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-100/80 to-pink-100/80 dark:from-purple-900/40 dark:to-pink-900/40 backdrop-blur-sm border border-white/20 text-purple-700 dark:text-purple-300 rounded-full text-sm font-semibold mb-8"
            >
              <Gift className="w-5 h-5 mr-3 animate-pulse" />
              Акции и скидки
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 80 }}
              className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 dark:text-white"
            >
              Специальные{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                предложения
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
            >
              Не упустите возможность сэкономить на лучших продуктах.
              Актуальные акции и скидки только для вас!
            </motion.p>

            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex justify-center"
              >
                <Link
                  to="/?auth=register"
                  className="inline-flex items-center bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  Зарегистрироваться и сэкономить
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Promotions Grid */}
      <section className="py-16">
        <div className="container-custom">
          {promotions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-20"
            >
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Акции временно отсутствуют
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Следите за обновлениями - скоро появятся новые предложения и скидки!
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {promotions.map((promotion, index) => (
                <motion.div
                  key={promotion.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 overflow-hidden cursor-pointer"
                  onClick={() => openPromotionModal(promotion)}
                >
                  {/* Image */}
                  {promotion.image_url && (
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={promotion.image_url}
                        alt={promotion.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Badge */}
                    <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold mb-4">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Активная акция
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                      {promotion.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                      {promotion.description.length > 100
                        ? `${promotion.description.substring(0, 100)}...`
                        : promotion.description}
                    </p>

                    {/* Dates */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>с {formatDate(promotion.starts_at)}</span>
                      </div>
                      {promotion.ends_at && (
                        <div className="flex items-center gap-1">
                          <span>до {formatDate(promotion.ends_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Подробнее
                    </motion.button>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-200/0 via-purple-200/10 to-pink-200/0 dark:from-purple-800/0 dark:via-purple-800/5 dark:to-pink-800/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 border-t border-gray-200 dark:border-gray-800"
        >
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto"
            >
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Готовы экономить?
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Зарегистрируйтесь и получайте доступ ко всем акциям и специальным предложениям
              </p>
              <Link
                to="/?auth=register"
                className="inline-flex items-center bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Gift className="w-5 h-5 mr-3" />
                Регистрация
                <ArrowRight className="w-5 h-5 ml-3" />
              </Link>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Promotion Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closePromotionModal}
        size="md"
        className="max-h-[90vh] overflow-y-auto"
      >
        {selectedPromotion && (
          <div className="space-y-6">
            {/* Image */}
            {selectedPromotion.image_url && (
              <div className="relative h-48 md:h-56 overflow-hidden rounded-2xl">
                <img
                  src={selectedPromotion.image_url}
                  alt={selectedPromotion.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            )}

            {/* Title */}
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {selectedPromotion.title}
              </h2>
              <div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
                <Sparkles className="w-3 h-3 mr-1" />
                Активная акция
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                <span className="font-medium">Начало:</span>
                <span className="break-words">{formatDate(selectedPromotion.starts_at)}</span>
              </div>
              {selectedPromotion.ends_at && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Окончание:</span>
                  <span className="break-words">{formatDate(selectedPromotion.ends_at)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Описание акции
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {selectedPromotion.description}
              </p>
            </div>


          </div>
        )}
      </Modal>
    </div>
  )
}

export default Promotions
