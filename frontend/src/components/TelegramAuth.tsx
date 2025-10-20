import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { telegram } from '@/assets/icons/social';
import { useAuth } from '@/hooks/useAuth';
import apiService, { TelegramAuthData } from '@/services/api';


// Track if auth data has been processed in this session
let authDataProcessed = false;

interface TelegramAuthProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramBot {
  id: number;
  username: string;
  first_name: string;
  last_name?: string;
}

interface TelegramWindow extends Window {
  Telegram?: {
    Login: {
      auth: (options: Record<string, unknown>, callback: (user: TelegramUser) => void) => void;
    };
  };
}

declare const window: TelegramWindow;

const TelegramAuth = ({ onSuccess, onError, className = '' }: TelegramAuthProps) => {
  const { login, user, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [botStatus, setBotStatus] = useState<{ configured: boolean; bot: TelegramBot | null } | null>(null);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  // Check Telegram bot status on mount and handle OAuth return
  useEffect(() => {
    checkTelegramStatus();

    // Check if we have Telegram OAuth data in sessionStorage (from redirect flow)
    const storedAuthData = sessionStorage.getItem('telegram_auth_data');
    if (storedAuthData && !authDataProcessed) {
      try {
        const telegramData = JSON.parse(storedAuthData);

        // Mark as processed to prevent re-processing on re-renders
        authDataProcessed = true;

        // Clear storage BEFORE processing to prevent loops
        sessionStorage.removeItem('telegram_auth_data');

        // Process auth data asynchronously
        handleTelegramAuth(telegramData).catch(authError => {
          console.error('Telegram Auth: Error during auth processing:', authError);
          // Reset flag on error so user can try again
          authDataProcessed = false;
        });

        return;
      } catch (error) {
        console.error('Telegram Auth: Failed to parse stored auth data:', error);
        sessionStorage.removeItem('telegram_auth_data');
        authDataProcessed = false;
      }
    }

    // Check if we have Telegram OAuth parameters in URL hash (legacy support)
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    const telegramData = {
      id: urlParams.get('id'),
      first_name: urlParams.get('first_name'),
      last_name: urlParams.get('last_name'),
      username: urlParams.get('username'),
      photo_url: urlParams.get('photo_url'),
      auth_date: urlParams.get('auth_date'),
      hash: urlParams.get('hash'),
    };

    // If we have all required parameters, process the auth
    if (telegramData.id && telegramData.first_name && telegramData.auth_date && telegramData.hash) {
      console.log('🔄 Telegram Auth: Detected OAuth return parameters in URL, processing auth');
      const userData: TelegramUser = {
        id: parseInt(telegramData.id),
        first_name: telegramData.first_name,
        last_name: telegramData.last_name || undefined,
        username: telegramData.username || undefined,
        photo_url: telegramData.photo_url || undefined,
        auth_date: parseInt(telegramData.auth_date),
        hash: telegramData.hash,
      };
      handleTelegramAuth(userData);

      // Clean up URL
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Listen for messages from auth popup (for future popup-based auth)
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our domain
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'telegram-auth' && event.data.telegramUser) {
        console.log('📨 Telegram Auth: Received auth data from popup');
        handleTelegramAuth(event.data.telegramUser);

        // Close popup
        if (authWindow) {
          authWindow.close();
          setAuthWindow(null);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authWindow]);

  // Reset processing flag when user logs out
  useEffect(() => {
    if (!isAuthenticated && !user) {
      authDataProcessed = false;
    }
  }, [isAuthenticated, user]);

  const checkTelegramStatus = async () => {
    try {
      console.log('🔍 Telegram Auth: Checking bot status from backend');
      const status = await apiService.getTelegramStatus();
      console.log('📊 Telegram Auth: Bot status received:', status);
      setBotStatus(status);
    } catch (error) {
      console.error('❌ Telegram Auth: Failed to check Telegram status:', error);
      // Set bot status to configured: false on error to allow fallback
      setBotStatus({ configured: false, bot: null });
    }
  };

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔐 Telegram Auth: Starting authentication process');
      console.log('📥 Telegram Auth: Received user data from Telegram:', {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url ? 'present' : 'not present',
        auth_date: telegramUser.auth_date,
        hash: telegramUser.hash ? 'present' : 'not present'
      });

      // Prepare auth data
      const authData: TelegramAuthData = {
        id: telegramUser.id.toString(),
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        photo_url: telegramUser.photo_url,
        auth_date: telegramUser.auth_date.toString(),
        hash: telegramUser.hash,
      };

      console.log('📤 Telegram Auth: Prepared auth data for backend:', authData);

      // Authenticate with backend
      console.log('🌐 Telegram Auth: Sending request to backend API');
      await login(authData);
      console.log('✅ Telegram Auth: Backend authentication successful');
      console.log('👤 Telegram Auth: User authenticated successfully');

      setSuccess(true);
      onSuccess?.();

      // Reset processing flag for next auth attempt
      setTimeout(() => {
        authDataProcessed = false;
        setSuccess(false);
      }, 3000);
    } catch (error: unknown) {
      console.error('❌ Telegram Auth: Authentication failed');
      console.error('🔍 Telegram Auth: Error details:', error);

      const errorMessage = apiService.handleApiError(error);
      console.error('📝 Telegram Auth: Processed error message:', errorMessage);

      setError(errorMessage);
      onError?.(errorMessage);

      // Hide error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
      console.log('🔄 Telegram Auth: Authentication process completed');
    }
  };

  const initTelegramWidget = () => {
    console.log('🚀 Telegram Auth: Initializing Telegram widget, botStatus:', botStatus);
    console.log('🚀 Telegram Auth: Current user state:', { user, isAuthenticated, authIsLoading, componentIsLoading: isLoading });

    // Reset any previous errors and processing state
    setError(null);
    authDataProcessed = false;

    // Check if Telegram Web App is available
    if (window.Telegram?.Login) {
      console.log('✅ Telegram Auth: Telegram Web App API is available');
      const botId = import.meta.env.VITE_TELEGRAM_BOT_ID;
      console.log('🔧 Telegram Auth: Bot ID from environment:', botId);

      if (!botId) {
        console.error('❌ Telegram Auth: Bot ID not configured in environment');
        setError('Telegram bot не настроен');
        return;
      }

      console.log('🔗 Telegram Auth: Calling Telegram.Login.auth with config:', {
        bot_id: botId,
        request_access: true
      });

      window.Telegram.Login.auth(
        {
          bot_id: botId,
          request_access: true,
        },
        handleTelegramAuth
      );
    } else {
      console.warn('⚠️ Telegram Auth: Telegram Web App API not available, using fallback');
      // Fallback: redirect to Telegram OAuth with return to handler
      const botId = import.meta.env.VITE_TELEGRAM_BOT_ID;
      if (botId) {
        // Use direct redirect to Telegram OAuth with return to our handler
        const handlerUrl = `${window.location.origin}/auth/telegram-handler`;
        const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(handlerUrl)}`;

        console.log('🔄 Telegram Auth: Redirecting to Telegram OAuth:', telegramAuthUrl);
        window.location.href = telegramAuthUrl;
      } else {
        console.error('❌ Telegram Auth: Bot ID not configured for fallback');
        setError('Telegram bot не настроен');
      }
    }
  };

  // Show loading state if bot status is not loaded yet
  if (!botStatus) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  // Show error if bot is not configured
  if (!botStatus.configured) {
    return (
      <div className={`text-center p-4 ${className}`}>
        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-600 dark:text-red-400">
          Telegram недоступен
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Auth Button */}
      <button
        onClick={initTelegramWidget}
        disabled={isLoading}
        className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-3 px-4 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : success ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <img src={telegram} alt="Telegram" className="w-4 h-4" />
        )}

        <span className="text-sm">
          {isLoading
            ? 'Авторизация...'
            : success
              ? 'Успешно!'
              : 'Войти через Telegram'
          }
        </span>

        {!isLoading && !success && (
          <ExternalLink className="w-3 h-3 opacity-60" />
        )}
      </button>

      {/* Status Messages */}
      <AnimatePresence>
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-sm text-green-700 dark:text-green-300">Авторизация успешна</p>
            </div>
          </div>
        )}
      </AnimatePresence>


      {/* Bot Info */}
      {botStatus.bot && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            @{botStatus.bot.username}
          </p>
        </div>
      )}
    </div>
  );
};

export default TelegramAuth;
