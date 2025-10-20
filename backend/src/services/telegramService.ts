import crypto from 'crypto';
import axios from 'axios';
import TelegramBot from 'node-telegram-bot-api';
import { config } from '@/config';
import { TelegramAuthData, TelegramUser } from '@/types';
import logger from '@/utils/logger';

class TelegramService {
  private bot?: TelegramBot;
  private botToken: string;

  constructor() {
    this.botToken = config.telegram.botToken;
    
    // Initialize bot only if token is provided
    if (this.botToken && this.botToken !== 'your_telegram_bot_token_here') {
      this.bot = new TelegramBot(this.botToken, { polling: false });
      this.setupBot();
    } else {
      logger.warn('⚠️ Telegram bot token not configured. Telegram auth will not work.');
    }
  }

  /**
   * Set up bot commands and event handlers
   */
  private setupBot(): void {
    if (!this.bot) return;

    // Handle /start command
    this.bot.onText(/\/start/, (msg: TelegramBot.Message) => {
      const chatId = msg.chat.id;
      const welcomeMessage = `
🎉 Добро пожаловать в Medusa Vape Shop!

Этот бот поможет вам авторизоваться на нашем сайте.

Для входа на сайт используйте кнопку "Войти через Telegram" на главной странице.

🌐 Сайт: ${config.cors.frontendUrl}
      `;

      this.bot?.sendMessage(chatId, welcomeMessage);
      logger.info(`New user started bot: ${chatId}`);
    });

    // Handle any text message
    this.bot.on('message', (msg: TelegramBot.Message) => {
      if (msg.text && !msg.text.startsWith('/')) {
        const chatId = msg.chat.id;
        this.bot?.sendMessage(chatId, 'Для авторизации используйте кнопку на сайте: ' + config.cors.frontendUrl);
      }
    });

    logger.info('✅ Telegram bot initialized successfully');
  }

  /**
   * Verify Telegram auth data hash
   */
  public verifyTelegramAuth(authData: TelegramAuthData): boolean {
    try {
      logger.info('🔐 Telegram Service: Starting auth verification');
      const { hash, ...data } = authData;

      logger.info('📝 Telegram Service: Received auth data:', {
        id: data.id,
        first_name: data.first_name,
        username: data.username,
        auth_date: data.auth_date,
        hash_provided: hash ? 'present' : 'missing'
      });

      // Create data check string
      const dataCheckString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key as keyof typeof data]}`)
        .join('\n');

      logger.info('🔗 Telegram Service: Created data check string');

      // Create secret key
      const secretKey = crypto
        .createHash('sha256')
        .update(this.botToken)
        .digest();

      // Create hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      logger.info('🔑 Telegram Service: Calculated hash, comparing with received hash');

      // Verify hash
      const isValid = calculatedHash === hash;

      // Check auth date (should be within 24 hours)
      const authDate = parseInt(authData.auth_date);
      const currentTime = Math.floor(Date.now() / 1000);
      const isRecent = (currentTime - authDate) <= 86400; // 24 hours

      logger.info('⏰ Telegram Service: Checking auth date freshness', {
        authDate,
        currentTime,
        timeDiff: currentTime - authDate,
        isRecent
      });

      if (!isRecent) {
        logger.warn('❌ Telegram Service: Auth data is too old');
        return false;
      }

      logger.info('✅ Telegram Service: Auth date is valid');

      if (isValid) {
        logger.info('✅ Telegram Service: Hash verification successful');
      } else {
        logger.warn('❌ Telegram Service: Hash verification failed');
        logger.debug('🔍 Telegram Service: Hash comparison details:', {
          received: hash,
          calculated: calculatedHash
        });
      }

      return isValid;
    } catch (error) {
      logger.error('❌ Telegram Service: Exception during auth verification:', error);
      return false;
    }
  }

  /**
   * Send message to user
   */
  public async sendMessage(chatId: string | number, message: string): Promise<boolean> {
    try {
      if (!this.bot) {
        logger.warn('Telegram bot not initialized');
        return false;
      }

      await this.bot.sendMessage(chatId, message);
      logger.info(`Message sent to ${chatId}`);
      return true;
    } catch (error) {
      logger.error('Error sending Telegram message:', error);
      return false;
    }
  }

  /**
   * Send welcome message to new user
   */
  public async sendWelcomeMessage(chatId: string | number, firstName: string): Promise<boolean> {
    logger.info('📨 Telegram Service: Preparing welcome message for user:', { chatId, firstName });

    const message = `
🎉 Добро пожаловать, ${firstName}!

Вы успешно авторизовались в Medusa Vape Shop.

🛍️ Теперь вы можете:
• Просматривать каталог товаров
• Добавлять товары в корзину
• Оформлять заказы
• Отслеживать статус заказов

Приятных покупок! 🚀
    `;

    const result = await this.sendMessage(chatId, message);
    if (result) {
      logger.info('✅ Telegram Service: Welcome message sent successfully');
    } else {
      logger.warn('❌ Telegram Service: Failed to send welcome message');
    }
    return result;
  }

  /**
   * Send order notification
   */
  public async sendOrderNotification(chatId: string | number, orderData: any): Promise<boolean> {
    const message = `
📦 Новый заказ оформлен!

Номер заказа: #${orderData.id}
Сумма: ${orderData.total} ₽
Статус: ${orderData.status}

Мы свяжемся с вами в ближайшее время для подтверждения заказа.

Спасибо за покупку! 🙏
    `;

    return this.sendMessage(chatId, message);
  }

  /**
   * Get user profile photo from Telegram
   */
  public async getUserProfilePhoto(telegramId: number): Promise<any> {
    try {
      logger.info(`🌐 Getting Telegram profile photo for user ID: ${telegramId}`);

      // Use axios to make request to Telegram API
      const response = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getUserProfilePhotos?user_id=${telegramId}&limit=1`
      );

      const data = response.data as any;

      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description}`);
      }

      const photos = data.result.photos;
      if (!photos || photos.length === 0) {
        logger.info(`📷 No profile photos found for user ${telegramId}`);
        return null;
      }

      // Get the largest photo (last in array)
      const largestPhoto = photos[0][photos[0].length - 1];
      const fileId = largestPhoto.file_id;

      logger.info(`📷 Found profile photo for user ${telegramId}, file_id: ${fileId}`);

      // Get file path
      const fileResponse = await axios.get(
        `https://api.telegram.org/bot${this.botToken}/getFile?file_id=${fileId}`
      );

      const fileData = fileResponse.data as any;

      if (!fileData.ok) {
        throw new Error(`Telegram API error getting file: ${fileData.description}`);
      }

      const filePath = fileData.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${filePath}`;

      logger.info(`✅ Successfully got profile photo URL for user ${telegramId}: ${fileUrl}`);
      return {
        photo_url: fileUrl,
        file_id: fileId,
        file_path: filePath
      };
    } catch (error) {
      logger.error(`❌ Error getting Telegram profile photo for user ${telegramId}:`, error);
      throw error;
    }
  }

  /**
   * Get bot info
   */
  public async getBotInfo(): Promise<TelegramBot.User | null> {
    try {
      if (!this.bot) return null;

      const botInfo = await this.bot.getMe();
      return botInfo;
    } catch (error) {
      logger.error('Error getting bot info:', error);
      return null;
    }
  }

  /**
   * Check if bot is configured and working
   */
  public async isConfigured(): Promise<boolean> {
    try {
      if (!this.bot) return false;
      
      const botInfo = await this.getBotInfo();
      return botInfo !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate Telegram login URL
   */
  public generateLoginUrl(redirectUrl: string): string {
    const botUsername = config.telegram.botUsername;
    
    if (!botUsername) {
      logger.warn('Telegram bot username not configured');
      return '';
    }

    const params = new URLSearchParams({
      bot_id: botUsername,
      origin: config.cors.frontendUrl,
      return_to: redirectUrl,
    });

    return `https://oauth.telegram.org/auth?${params.toString()}`;
  }
}

// Export singleton instance
export default new TelegramService();
