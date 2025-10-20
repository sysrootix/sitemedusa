import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowLeft, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { telegram } from '@/assets/icons/social';
import { useAuth } from '@/hooks/useAuth';
import apiService from '@/services/api';


type AuthStep = 'phone' | 'code';

interface PhoneAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

const PhoneAuth = ({ onSuccess, onError, className = '' }: PhoneAuthProps) => {
  const { login, isAuthenticated } = useAuth();

  const [currentStep, setCurrentStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [expiresIn, setExpiresIn] = useState(0);

  // Countdown timer for code expiration
  useEffect(() => {
    let interval: number;

    if (codeSent && expiresIn > 0) {
      interval = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            setCodeSent(false);
            setError('Код подтверждения истек. Попробуйте еще раз.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [codeSent, expiresIn]);

  // Reset state when authentication succeeds
  useEffect(() => {
    if (isAuthenticated && success) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setCurrentStep('phone');
        setPhone('');
        setCode('');
        setCodeSent(false);
        setExpiresIn(0);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, success]);

  // Format phone number as user types with smart formatting
  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    let digits = value.replace(/\D/g, '');

    // Smart handling of different input formats
    if (digits.length > 0) {
      // If starts with 8, replace with 7 (common Russian input)
      if (digits[0] === '8') {
        digits = '7' + digits.slice(1);
      }
      // If starts with 9, immediately add +7 prefix
      else if (digits[0] === '9') {
        digits = '7' + digits; // Add country code
      }
    }

    // Ensure we have at most 11 digits (country code + 10 digits)
    digits = digits.slice(0, 11);

    // Format as +7 (XXX) XXX-XX-XX for Russian numbers
    if (digits.length === 0) return '';
    if (digits.length === 1) return digits;
    if (digits.length <= 4) return `+${digits}`;
    if (digits.length <= 7) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    if (error) {
      setError(null);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (error) {
      setError(null);
    }
  };

  // Auto-hide error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const sendAuthCode = async () => {
    if (!phone) {
      setError('Введите номер телефона');
      return;
    }

    // Basic phone validation - require complete number
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 11) {
      setError('Введите полный номер телефона');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Phone Auth: Sending code to ${phone}`);
      const response = await apiService.sendPhoneAuthCode(phone);

      if (response.sent) {
        setCodeSent(true);
        setExpiresIn(response.expiresIn * 60); // Convert minutes to seconds
        setCurrentStep('code');
        console.log('Phone Auth: Code sent successfully');
      }
    } catch (error: unknown) {
      console.error('Phone Auth: Failed to send code:', error instanceof Error ? error.message : error);
      const errorMessage = apiService.handleApiError(error);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAuthCode = async () => {
    if (!code || code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Phone Auth: Verifying code for ${phone}`);
      await login({ phone, code });

      console.log('Phone Auth: Authentication successful');
      setSuccess(true);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Phone Auth: Code verification failed:', error instanceof Error ? error.message : error);
      const errorMessage = apiService.handleApiError(error);
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const goBackToPhone = () => {
    setCurrentStep('phone');
    setCode('');
    setError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Auth Container */}
      <div className="relative">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-3">
            {currentStep === 'phone' ? (
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {currentStep === 'phone' ? 'Вход по телефону' : 'Код подтверждения'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {currentStep === 'phone'
              ? 'Код придет в Telegram'
              : `Отправлено на ${phone}`
            }
          </p>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone Input Step */}
        <AnimatePresence mode="wait">
          {currentStep === 'phone' && (
            <motion.div
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (999) 123-45-67"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isLoading}
                />
              </div>

              <button
                onClick={sendAuthCode}
                disabled={isLoading || phone.replace(/\D/g, '').length !== 11}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}

                <span>
                  {isLoading
                    ? 'Отправка...'
                    : success
                      ? 'Успешно!'
                      : 'Отправить код'
                  }
                </span>
              </button>
            </motion.div>
          )}

          {/* Code Input Step */}
          {currentStep === 'code' && (
            <motion.div
              key="code-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={goBackToPhone}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Изменить номер</span>
                </button>

                {codeSent && expiresIn > 0 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(expiresIn)}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Код подтверждения
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  maxLength={6}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-center text-xl font-mono tracking-wider ${
                    error ? 'border-red-300 dark:border-red-600 ring-2 ring-red-100 dark:ring-red-900/50' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  6-значный код из Telegram
                </p>
              </div>

              {/* Bot link button */}
              <div className="text-center">
                <a
                  href="https://t.me/MedusaMDA_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <img src={telegram} alt="Telegram" className="w-4 h-4" />
                  <span>Открыть бота</span>
                </a>
              </div>

              <button
                onClick={verifyAuthCode}
                disabled={isLoading || code.length !== 6}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : success ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}

                <span>
                  {isLoading
                    ? 'Проверка...'
                    : success
                      ? 'Успешно!'
                      : 'Подтвердить'
                  }
                </span>
              </button>

              <div className="flex justify-center mt-3">
                <button
                  onClick={sendAuthCode}
                  disabled={isLoading}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Отправить повторно
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">Авторизация успешна</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PhoneAuth;
