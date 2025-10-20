import { Phone, UserPlus, LogIn, ArrowLeft, ExternalLink } from 'lucide-react'
import { telegram } from '@/assets/icons/social'
import Modal from './Modal'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TelegramAuth from '@/components/TelegramAuth'
import PhoneAuth from '@/components/PhoneAuth'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [step, setStep] = useState<'choice' | 'login'>('choice')
  const [authMethod, setAuthMethod] = useState<'telegram' | 'phone'>('telegram')
  const navigate = useNavigate()

  const handleAuthSuccess = () => {
    onClose()
    setStep('choice') // Сброс состояния при закрытии
    // Редирект на профиль после успешной авторизации
    navigate('/profile')
  }

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error)
    // Could show toast notification here
  }

  const handleClose = () => {
    onClose()
    // Сброс состояния с задержкой для плавной анимации
    setTimeout(() => setStep('choice'), 300)
  }

  const handleRegistrationClick = () => {
    const registrationUrl = 'https://webapp.mda-platform.top?utm_source=newsite&utm_medium=page&utm_campaign=login'
    window.open(registrationUrl, '_blank')
    handleClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="relative overflow-hidden px-4 py-6 sm:px-6 sm:py-8">
        <AnimatePresence mode="wait">
          {step === 'choice' ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {renderChoiceStep()}
            </motion.div>
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {renderLoginStep()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )

  function renderChoiceStep() {
    return (
      <>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-8"
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <LogIn className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Войти в систему
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Выберите способ входа
          </p>
        </motion.div>

        {/* Choice Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-3"
        >
          <button
            onClick={() => setStep('login')}
            className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Войти</span>
          </button>

          <button
            onClick={handleRegistrationClick}
            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Регистрация</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </button>
        </motion.div>
      </>
    )
  }

  function renderLoginStep() {
    return (
      <>
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setStep('choice')}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Назад</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-6"
        >
          <div className="w-10 h-10 mx-auto mb-3 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <AnimatePresence mode="wait">
              {authMethod === 'telegram' ? (
                <img src={telegram} alt="Telegram" className="w-5 h-5" />
              ) : (
                <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </AnimatePresence>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Вход через {authMethod === 'telegram' ? 'Telegram' : 'телефон'}
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Выберите способ авторизации
          </p>
        </motion.div>

        {/* Auth Method Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
            <button
              onClick={() => setAuthMethod('telegram')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                authMethod === 'telegram'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <img src={telegram} alt="Telegram" className="w-4 h-4" />
              <span>Telegram</span>
            </button>
            <button
              onClick={() => setAuthMethod('phone')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                authMethod === 'phone'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Телефон</span>
            </button>
          </div>
        </motion.div>

        {/* Auth Components */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {authMethod === 'telegram' ? (
              <motion.div
                key="telegram-auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <TelegramAuth
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  className="w-full"
                />
              </motion.div>
            ) : (
              <motion.div
                key="phone-auth"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <PhoneAuth
                  onSuccess={handleAuthSuccess}
                  onError={handleAuthError}
                  className="w-full"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </>
    )
  }
}

export default AuthModal
