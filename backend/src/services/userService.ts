import { Op } from 'sequelize';
import User from '@/models/User';
import { UserRegistrationData, UserUpdateData, UserRole, UserStatus } from '@/types';
import logger from '@/utils/logger';

class UserService {
  /**
   * Find user by Telegram ID
   */
  public async findByTelegramId(telegramId: number): Promise<User | null> {
    try {
      return await User.findOne({
        where: { telegram_id: telegramId },
      });
    } catch (error) {
      logger.error('Error finding user by Telegram ID:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by ID
   */
  public async findById(id: string): Promise<User | null> {
    try {
      return await User.findByPk(id);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by username
   */
  public async findByUsername(username: string): Promise<User | null> {
    try {
      return await User.findOne({
        where: { username: username.toLowerCase() },
      });
    } catch (error) {
      logger.error('Error finding user by username:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by phone
   */
  public async findByPhone(phone: string): Promise<User | null> {
    try {
      return await User.findOne({
        where: { 
          [Op.or]: [
            { phone: phone },
            { normalized_phone: phone }
          ]
        },
      });
    } catch (error) {
      logger.error('Error finding user by phone:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Create new user
   */
  public async createUser(userData: UserRegistrationData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.findByTelegramId(userData.telegram_id);
      if (existingUser) {
        throw new Error('User already exists');
      }

      // Check if username is taken (if provided)
      if (userData.username) {
        const userWithUsername = await this.findByUsername(userData.username);
        if (userWithUsername) {
          throw new Error('Username already taken');
        }
      }

      // Check if phone is taken (if provided)
      if (userData.phone) {
        const userWithPhone = await this.findByPhone(userData.phone);
        if (userWithPhone) {
          throw new Error('Phone already taken');
        }
      }

      // Generate referral code
      const referralCode = Math.random().toString(36).substring(2, 12).toUpperCase();

      // Create user
      const user = await User.create({
        telegram_id: userData.telegram_id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        username: userData.username?.toLowerCase(),
        photo_url: userData.photo_url,
        language_code: userData.language_code || 'ru',
        is_active: true,
        role: UserRole.USER,
        bonus: 100, // Welcome bonus
        status: UserStatus.BRONZE,
        total_spent: 0,
        total_referrals: 0,
        referral_code: referralCode,
        consent_personal_data: false,
        consent_marketing: false,
        allows_write_to_pm: false,
        is_premium: false,
        bonus_easter_egg: false,
        has_seen_tour: false,
        referral_bonus_received: false,
      } as any);

      logger.info(`New user created: ${user.id} (${user.getDisplayName()})`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create user');
    }
  }

  /**
   * Update user
   */
  public async updateUser(userId: string, updateData: UserUpdateData): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if username is taken by another user
      if (updateData.username && updateData.username !== user.username) {
        const userWithUsername = await User.findOne({
          where: {
            username: updateData.username.toLowerCase(),
            id: { [Op.ne]: userId },
          },
        });
        if (userWithUsername) {
          throw new Error('Username already taken');
        }
      }

      // Check if phone is taken by another user
      if (updateData.phone && updateData.phone !== user.phone) {
        const userWithPhone = await this.findByPhone(updateData.phone);
        if (userWithPhone && userWithPhone.id !== userId) {
          throw new Error('Phone already taken');
        }
      }

      // Normalize phone if provided
      let normalizedPhone = updateData.phone;
      if (updateData.phone) {
        normalizedPhone = updateData.phone.replace(/\D/g, '');
      }

      // Update user
      await user.update({
        ...(updateData as any),
        username: updateData.username?.toLowerCase(),
        normalized_phone: normalizedPhone,
      });

      logger.info(`User updated: ${user.id} (${user.getDisplayName()})`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update user');
    }
  }

  /**
   * Update user last login
   */
  public async updateLastLogin(userId: string): Promise<void> {
    try {
      await User.update(
        { last_login: new Date() },
        { where: { id: userId } }
      );
    } catch (error) {
      logger.error('Error updating last login:', error);
      // Don't throw error for this operation
    }
  }

  /**
   * Deactivate user
   */
  public async deactivateUser(userId: string): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ is_active: false });
      logger.info(`User deactivated: ${user.id} (${user.getDisplayName()})`);
      return user;
    } catch (error) {
      logger.error('Error deactivating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to deactivate user');
    }
  }

  /**
   * Activate user
   */
  public async activateUser(userId: string): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ is_active: true });
      logger.info(`User activated: ${user.id} (${user.getDisplayName()})`);
      return user;
    } catch (error) {
      logger.error('Error activating user:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to activate user');
    }
  }

  /**
   * Change user role
   */
  public async changeUserRole(userId: string, newRole: UserRole): Promise<User> {
    try {
      const user = await this.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ role: newRole });
      logger.info(`User role changed: ${user.id} (${user.getDisplayName()}) -> ${newRole}`);
      return user;
    } catch (error) {
      logger.error('Error changing user role:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to change user role');
    }
  }

  /**
   * Get user statistics
   */
  public async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    byRole: Record<UserRole, number>;
  }> {
    try {
      const [total, active, inactive, verified] = await Promise.all([
        User.count(),
        User.count({ where: { is_active: true } }),
        User.count({ where: { is_active: false } }),
        User.count({ where: { role: UserRole.ADMIN } }), // Count admins as "verified" for stats
      ]);

      const byRole = {} as Record<UserRole, number>;
      for (const role of Object.values(UserRole)) {
        byRole[role] = await User.count({ where: { role } });
      }

      return {
        total,
        active,
        inactive,
        verified,
        byRole,
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw new Error('Failed to get user statistics');
    }
  }

  /**
   * Search users
   */
  public async searchUsers(
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ users: User[]; total: number }> {
    try {
      const whereClause = {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${query}%` } },
          { last_name: { [Op.iLike]: `%${query}%` } },
          { username: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
        ],
      };

      const [users, total] = await Promise.all([
        User.findAll({
          where: whereClause,
          limit,
          offset,
          order: [['created_at', 'DESC']],
        }),
        User.count({ where: whereClause }),
      ]);

      return { users, total };
    } catch (error) {
      logger.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get recent users
   */
  public async getRecentUsers(limit: number = 10): Promise<User[]> {
    try {
      return await User.findAll({
        where: { is_active: true },
        limit,
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      logger.error('Error getting recent users:', error);
      throw new Error('Failed to get recent users');
    }
  }
}

// Export singleton instance
export default new UserService();
