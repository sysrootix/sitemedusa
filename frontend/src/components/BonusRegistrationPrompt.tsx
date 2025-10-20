import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Sparkles } from 'lucide-react'

const BonusRegistrationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(localStorage.getItem('ageConfirmed'))

  // Слушаем изменения localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setAgeConfirmed(localStorage.getItem('ageConfirmed'))
    }

    // Добавляем слушатель на событие storage (для других вкладок)
    window.addEventListener('storage', handleStorageChange)

    // Также слушаем кастомное событие для изменений в той же вкладке
    window.addEventListener('ageConfirmed', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('ageConfirmed', handleStorageChange)
    }
  }, [])

  useEffect(() => {
    console.log('🎯 BonusRegistrationPrompt: Проверяем условия показа (ageConfirmed:', ageConfirmed, ')')

    // Проверяем, подтверждал ли пользователь возраст
    const hasConfirmedAge = ageConfirmed
    const dismissedUntil = localStorage.getItem('bonusPromptDismissedUntil')

    console.log('📊 Состояние localStorage:', {
      hasConfirmedAge,
      dismissedUntil,
      currentTime: new Date().toLocaleString()
    })

    // Если возраст не подтвержден - полагаемся на AgeVerificationModal для показа окна подтверждения
    if (!hasConfirmedAge) {
      console.log('🎂 Возраст не подтвержден - полагаемся на AgeVerificationModal')
      return
    }

    // Проверяем, не скрыто ли уведомление временно (на 1 час)
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil)
      const timeSinceDismissed = Date.now() - dismissedTime
      const oneHourInMs = 60 * 60 * 1000 // 1 час

      console.log('⏰ Время с последнего скрытия:', {
        dismissedTime: new Date(dismissedTime).toLocaleString(),
        timeSinceDismissed: Math.round(timeSinceDismissed / (1000 * 60)) + ' минут',
        oneHourInMs: Math.round(oneHourInMs / (1000 * 60)) + ' минут',
        shouldShow: timeSinceDismissed > oneHourInMs
      })

      if (timeSinceDismissed < oneHourInMs) {
        console.log('⏳ Уведомление скрыто на 1 час')
        return
      }
    }

    // Показываем уведомление через 3 секунды после загрузки страницы
    console.log('✅ Планируем показ уведомления через 3 секунды')
    const timer = setTimeout(() => {
      console.log('✅ Показываем уведомление')
      setIsVisible(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [ageConfirmed])

  const handleDismiss = () => {
    // Скрываем уведомление на 1 час
    const oneHourFromNow = Date.now() + (60 * 60 * 1000) // 1 час
    localStorage.setItem('bonusPromptDismissedUntil', oneHourFromNow.toString())
    setIsVisible(false)
  }

  const handleLater = () => {
    // Скрываем на 1 час (как крестик)
    const oneHourFromNow = Date.now() + (60 * 60 * 1000) // 1 час
    localStorage.setItem('bonusPromptDismissedUntil', oneHourFromNow.toString())
    setIsVisible(false)
  }

  const handleConfirm = () => {
    // Для бонусного уведомления - перенаправляем на страницу
    localStorage.removeItem('bonusPromptDismissedUntil') // Убираем ограничение по времени
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop for mobile touch */}
          <div
            className="fixed inset-0 z-40 md:pointer-events-none"
            onClick={handleDismiss}
          />

          {/* Toast Notification */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.5
            }}
            className="fixed bottom-4 left-[2%] right-[18%] md:left-auto md:right-6 md:bottom-6 z-50 max-w-sm w-full md:mx-4"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              <div className="p-4">
                {/* Icon and badge */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      🎁 Бонусная программа
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Специальное предложение
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    +100 баллов за регистрацию!
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Зарегистрируйтесь в бонусной программе и получите приветственные 100 баллов на первую покупку
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLater}
                    className="flex-1 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Позже
                  </motion.button>

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to="/bonus-system"
                      onClick={handleConfirm}
                      className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Узнать больше
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default BonusRegistrationPrompt
