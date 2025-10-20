import crypto from 'crypto';
import { Op } from 'sequelize';
import PhoneAuthCode from '@/models/PhoneAuthCode';
import User from '@/models/User';
import telegramService from '@/services/telegramService';
import logger from '@/utils/logger';

class PhoneAuthService {
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 10;

  /**
   * Normalize phone number for database lookup (digits only, starting with 7)
   */
  public normalizePhone(phone: string): string {
    // Remove all non-digit characters
    let normalized = phone.replace(/\D/g, '');

    // Handle different formats
    if (normalized.startsWith('8')) {
      // Convert 8 to 7 for Russian numbers
      normalized = '7' + normalized.substring(1);
    } else if (normalized.startsWith('7')) {
      // Already starts with 7, keep as is
    } else if (normalized.length === 10) {
      // Assume it's a Russian number without country code
      normalized = '7' + normalized;
    } else {
      // Default to 7 prefix if not present
      normalized = '7' + normalized;
    }

    return normalized;
  }

  /**
   * Generate random 6-digit code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired codes
   */
  public async cleanupExpiredCodes(): Promise<void> {
    try {
      const result = await PhoneAuthCode.destroy({
        where: {
          [Op.or]: [
            { expires_at: { [Op.lt]: new Date() } },
            { used: true }
          ]
        }
      });

      if (result > 0) {
        logger.info(`Cleaned up ${result} expired or used phone auth codes`);
      }
    } catch (error) {
      logger.error('Error cleaning up expired codes:', error);
    }
  }

  /**
   * Send authentication code to phone via Telegram
   */
  public async sendAuthCode(phone: string): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('📱 Phone Auth: Starting auth code sending process for phone:', phone);

      // Normalize phone number
      const normalizedPhone = this.normalizePhone(phone);
      logger.info('📱 Phone Auth: Normalized phone:', normalizedPhone);

      // Find user by normalized phone
      const user = await User.findOne({
        where: {
          normalized_phone: normalizedPhone
        }
      });

      if (!user) {
        logger.warn('📱 Phone Auth: User not found for phone:', normalizedPhone);
        return { success: false, error: 'Пользователь с таким номером телефона не найден' };
      }

      if (!user.telegram_id) {
        logger.warn('📱 Phone Auth: User has no Telegram ID:', user.id);
        return { success: false, error: 'Для авторизации по телефону необходимо сначала авторизоваться через Telegram' };
      }

      // Clean up old codes for this phone
      await PhoneAuthCode.destroy({
        where: {
          phone: normalizedPhone,
          [Op.or]: [
            { expires_at: { [Op.lt]: new Date() } },
            { used: true }
          ]
        }
      });

      // Generate new code
      const code = this.generateCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      logger.info('📱 Phone Auth: Generated code for user:', user.id);

      // Save code to database
      await PhoneAuthCode.create({
        phone: normalizedPhone,
        code,
        expires_at: expiresAt,
        used: false,
      });

      // Send code via Telegram
      const message = `
🔐 Код подтверждения для входа на сайт

Ваш код: ${code}

⏰ Код действителен в течение ${this.CODE_EXPIRY_MINUTES} минут

Если вы не запрашивали этот код, проигнорируйте это сообщение.

🌐 Medusa Vape Shop
      `;

      const sent = await telegramService.sendMessage(user.telegram_id, message);

      if (sent) {
        logger.info('✅ Phone Auth: Auth code sent successfully to user:', user.id);
        return { success: true };
      } else {
        logger.error('❌ Phone Auth: Failed to send auth code to user:', user.id);
        // Clean up the code if sending failed
        await PhoneAuthCode.destroy({
          where: {
            phone: normalizedPhone,
            code,
            used: false
          }
        });
        return { success: false, error: 'Не удалось отправить код подтверждения' };
      }
    } catch (error) {
      logger.error('❌ Phone Auth: Error sending auth code:', error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Verify authentication code
   */
  public async verifyAuthCode(phone: string, code: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      logger.info('🔍 Phone Auth: Starting code verification for phone:', phone);

      // Normalize phone number
      const normalizedPhone = this.normalizePhone(phone);
      logger.info('🔍 Phone Auth: Normalized phone:', normalizedPhone);

      // Find valid code
      const authCode = await PhoneAuthCode.findOne({
        where: {
          phone: normalizedPhone,
          code,
          used: false,
          expires_at: {
            [Op.gt]: new Date()
          }
        }
      });

      if (!authCode) {
        logger.warn('❌ Phone Auth: Invalid or expired code for phone:', normalizedPhone);
        return { success: false, error: 'Неверный или истекший код подтверждения' };
      }

      logger.info('✅ Phone Auth: Code verified, finding user');

      // Find user by normalized phone
      const user = await User.findOne({
        where: {
          normalized_phone: normalizedPhone
        }
      });

      if (!user) {
        logger.warn('❌ Phone Auth: User not found for verified phone:', normalizedPhone);
        return { success: false, error: 'Пользователь не найден' };
      }

      // Mark code as used
      await authCode.update({ used: true });

      // Update last login
      await user.update({ last_login: new Date() });

      logger.info('✅ Phone Auth: Authentication successful for user:', user.id);

      return { success: true, user };
    } catch (error) {
      logger.error('❌ Phone Auth: Error verifying auth code:', error);
      return { success: false, error: 'Внутренняя ошибка сервера' };
    }
  }

  /**
   * Check if phone number format is valid
   */
  public isValidPhone(phone: string): boolean {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');

    // Russian phone number validation
    // Should be 10-11 digits, starting with 7, 8, or no prefix
    const isValidLength = digits.length >= 10 && digits.length <= 11;
    const startsWithValidDigit = digits.startsWith('7') || digits.startsWith('8') ||
                                  (!digits.startsWith('7') && !digits.startsWith('8'));

    return isValidLength && startsWithValidDigit;
  }
}

// Export singleton instance
export default new PhoneAuthService();
