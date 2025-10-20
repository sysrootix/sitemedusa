import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const AgeVerificationModal = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)

  useEffect(() => {
    // Проверяем, подтверждал ли пользователь возраст ранее
    const hasConfirmedAge = localStorage.getItem('ageConfirmed')
    const hasRejectedAge = localStorage.getItem('ageRejected')

    console.log('🔞 AgeVerificationModal: Проверяем условия показа')
    console.log('📊 Состояние localStorage:', {
      hasConfirmedAge: hasConfirmedAge === null ? 'null' : `"${hasConfirmedAge}"`,
      hasRejectedAge: hasRejectedAge === null ? 'null' : `"${hasRejectedAge}"`,
      hasConfirmedAgeType: typeof hasConfirmedAge,
      hasRejectedAgeType: typeof hasRejectedAge,
      currentTime: new Date().toLocaleString()
    })

    // Показываем окно, если возраст не подтвержден (игнорируем факт предыдущего отклонения)
    const shouldShowModal = hasConfirmedAge === null

    console.log('🎯 Результат проверки:', {
      shouldShowModal,
      hasConfirmedAgeIsNull: hasConfirmedAge === null,
      hasRejectedAgeIsNull: hasRejectedAge === null
    })

    if (shouldShowModal) {
      console.log('✅ Показываем модальное окно подтверждения возраста через 500мс')
      // Небольшая задержка перед показом модалки
      const timer = setTimeout(() => {
        console.log('🎯 AgeVerificationModal: Показываем модальное окно')
        setIsVisible(true)
      }, 500)

      return () => clearTimeout(timer)
    } else {
      console.log('❌ Не показываем модальное окно: возраст уже подтвержден')
    }
  }, [])

  const handleConfirm = () => {
    localStorage.setItem('ageConfirmed', 'true')
    setIsVisible(false)
    setShowRejectionModal(false)
    // Отправляем событие для обновления других компонентов
    window.dispatchEvent(new Event('ageConfirmed'))
  }

  const handleReject = () => {
    // Не устанавливаем ageRejected, чтобы окно могло показаться снова
    setIsVisible(false)
    setShowRejectionModal(true)
  }

  const handleFinalReject = () => {
    // Устанавливаем окончательное отклонение только при финальном отказе
    localStorage.setItem('ageRejected', 'true')
    window.location.href = 'https://www.google.com'
  }

  return (
    <>
      {/* Age Verification Modal */}
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-sm w-full mx-4 overflow-hidden"
              >
                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl sm:text-3xl">🔞</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    Подтверждение возраста
                  </h2>

                  {/* Description */}
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    Для доступа к нашему сайту необходимо подтвердить, что вам исполнилось 18 лет.
                    <br />
                    <strong className="text-gray-900 dark:text-white">Вам есть 18 лет?</strong>
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleReject}
                      className="flex-1 px-4 py-3 sm:px-5 sm:py-3 md:px-4 md:py-2.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 text-sm"
                    >
                      Нет
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      className="group flex-1 px-4 py-3 sm:px-5 sm:py-3 md:px-4 md:py-2.5 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25 relative overflow-hidden text-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">Да, мне есть 18</span>
                    </motion.button>
                  </div>

                  {/* Legal notice */}
                  <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-6">
                    Продолжая, вы подтверждаете, что вам исполнилось 18 лет и вы согласны с нашими условиями использования.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectionModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 max-w-sm w-full mx-4 overflow-hidden"
              >
                {/* Content */}
                <div className="p-6 sm:p-8">
                  {/* Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl sm:text-3xl">🚫</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
                    Доступ запрещен
                  </h2>

                  {/* Description */}
                  <p className="text-center text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                    К сожалению, для использования нашего сайта необходимо быть совершеннолетним (18+ лет).
                    <br />
                    <br />
                    <strong className="text-gray-900 dark:text-white">Возможно, вы ошиблись?</strong>
                  </p>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFinalReject}
                      className="flex-1 px-4 py-3 sm:px-5 sm:py-3 md:px-4 md:py-2.5 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-200 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 border border-gray-200/50 dark:border-gray-700/50 text-sm"
                    >
                      Уйти с сайта
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      className="group flex-1 px-4 py-3 sm:px-5 sm:py-3 md:px-4 md:py-2.5 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-700 hover:via-purple-800 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-purple-500/25 relative overflow-hidden text-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">Мне есть 18 лет</span>
                    </motion.button>
                  </div>

                  {/* Additional notice */}
                  <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-6">
                    Если вы подтвердите возраст, мы продолжим работу с сайтом.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default AgeVerificationModal
