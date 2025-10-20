import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const TelegramAuthHandler = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = React.useState<'loading' | 'processing' | 'redirecting' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  useEffect(() => {
    console.log('🚀 Telegram Auth Handler: Page loaded, checking parameters');
    console.log('📋 Telegram Auth Handler: Current URL:', window.location.href);
    console.log('🔗 Telegram Auth Handler: Hash:', window.location.hash);

    const botId = searchParams.get('bot_id');

    // Check if we have Telegram auth result in hash (returned from Telegram OAuth)
    const hash = window.location.hash.substring(1); // Remove the '#'
    const tgAuthResult = hash.match(/tgAuthResult=([^&]*)/)?.[1];

    if (tgAuthResult) {
      console.log('✅ Telegram Auth Handler: Found tgAuthResult, processing auth data');
      setStatus('processing');

      try {
        // Decode base64 and parse JSON
        const decodedData = atob(tgAuthResult);
        const telegramData = JSON.parse(decodedData);

        console.log('📝 Telegram Auth Handler: Decoded auth data:', telegramData);

        // Validate required fields
        if (telegramData.id && telegramData.first_name && telegramData.auth_date && telegramData.hash) {
          console.log('✅ Telegram Auth Handler: Auth data is valid, storing and redirecting');

          // Store auth data in sessionStorage to pass to main app
          sessionStorage.setItem('telegram_auth_data', JSON.stringify(telegramData));

          setStatus('redirecting');
          // Redirect back to main app
          const mainAppUrl = window.location.origin + '/';
          console.log('🔄 Telegram Auth Handler: Redirecting to main app:', mainAppUrl);
          window.location.href = mainAppUrl;
        } else {
          console.error('❌ Telegram Auth Handler: Invalid auth data structure:', telegramData);
          setStatus('error');
          setErrorMessage('Неверный формат данных авторизации');
        }
      } catch (error) {
        console.error('❌ Telegram Auth Handler: Failed to decode/parse auth data:', error);
        setStatus('error');
        setErrorMessage('Ошибка обработки данных авторизации');
      }
      return;
    }

    // No auth data found, check if we have bot_id for initial redirect
    if (!botId) {
      console.error('❌ Telegram Auth Handler: No bot_id provided and no auth data found');
      console.log('❌ Telegram Auth Handler: Search params:', Object.fromEntries(searchParams.entries()));
      setStatus('error');
      setErrorMessage('Отсутствует идентификатор бота');
      return;
    }

    console.log('✅ Telegram Auth Handler: Starting OAuth flow for bot:', botId);
    setStatus('redirecting');

    // Redirect to Telegram OAuth
    const currentUrl = window.location.origin + window.location.pathname;
    const telegramAuthUrl = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(window.location.origin)}&return_to=${encodeURIComponent(currentUrl)}`;

    console.log('🔗 Telegram Auth Handler: Redirecting to:', telegramAuthUrl);
    window.location.href = telegramAuthUrl;
  }, [searchParams]);

  const getStatusContent = () => {
    switch (status) {
      case 'processing':
        return {
          title: 'Обработка авторизации',
          message: 'Проверяем данные от Telegram...',
          showSpinner: true
        };
      case 'redirecting':
        return {
          title: 'Перенаправление',
          message: 'Возвращаемся в приложение...',
          showSpinner: true
        };
      case 'error':
        return {
          title: 'Ошибка авторизации',
          message: errorMessage || 'Произошла ошибка при авторизации',
          showSpinner: false
        };
      default:
        return {
          title: 'Авторизация через Telegram',
          message: 'Перенаправляем на Telegram...',
          showSpinner: true
        };
    }
  };

  const { title, message, showSpinner } = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {showSpinner && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        {!showSpinner && (
          <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        )}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
        {status === 'error' && (
          <button
            onClick={() => window.location.href = window.location.origin + '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </button>
        )}
      </div>
    </div>
  );
};

export default TelegramAuthHandler;
