import { DataTypes, Model, Optional, Op } from 'sequelize';
import { UserRole, UserStatus } from '@/types';
import sequelize from '@/config/database';
import StatusConfig from './StatusConfig';

// User attributes interface matching your existing table
interface UserAttributes {
  id: string;
  telegram_id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  language_code?: string;
  is_premium?: boolean;
  role?: UserRole;
  is_active?: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  phone?: string;
  birthdate?: Date;
  consent_personal_data?: boolean;
  consent_marketing?: boolean;
  photo_url?: string;
  allows_write_to_pm?: boolean;
  bonus?: number;
  status?: UserStatus;
  total_spent?: number;
  bonus_easter_egg?: boolean;
  has_seen_tour?: boolean;
  referral_code?: string;
  referred_by?: string;
  referral_bonus_received?: boolean;
  total_referrals?: number;
  gender?: string;
  registration_ip?: string;
  utm_campaign_id?: string;
  normalized_phone?: string;
  position?: string;
  age?: number;
}

// Creation attributes (only telegram_id is required for creation)
interface UserCreationAttributes extends Optional<UserAttributes, 
  'id' | 'username' | 'first_name' | 'last_name' | 'middle_name' | 'language_code' | 
  'is_premium' | 'role' | 'is_active' | 'created_at' | 'updated_at' | 'last_login' | 
  'phone' | 'birthdate' | 'consent_personal_data' | 'consent_marketing' | 'photo_url' | 
  'allows_write_to_pm' | 'bonus' | 'status' | 'total_spent' | 'bonus_easter_egg' | 
  'has_seen_tour' | 'referral_code' | 'referred_by' | 'referral_bonus_received' | 
  'total_referrals' | 'gender' | 'registration_ip' | 'utm_campaign_id' | 
  'normalized_phone' | 'position' | 'age'
> {}

// User model class
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public telegram_id?: number;
  public username?: string;
  public first_name?: string;
  public last_name?: string;
  public middle_name?: string;
  public language_code?: string;
  public is_premium?: boolean;
  public role?: UserRole;
  public is_active?: boolean;
  public last_login?: Date;
  public phone?: string;
  public birthdate?: Date;
  public consent_personal_data?: boolean;
  public consent_marketing?: boolean;
  public photo_url?: string;
  public allows_write_to_pm?: boolean;
  public bonus?: number;
  public status?: UserStatus;
  public total_spent?: number;
  public bonus_easter_egg?: boolean;
  public has_seen_tour?: boolean;
  public referral_code?: string;
  public referred_by?: string;
  public referral_bonus_received?: boolean;
  public total_referrals?: number;
  public gender?: string;
  public registration_ip?: string;
  public utm_campaign_id?: string;
  public normalized_phone?: string;
  public position?: string;
  public age?: number;
  
  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public statusConfig?: StatusConfig;

  // Instance methods
  public getFullName(): string {
    const parts = [this.first_name, this.middle_name, this.last_name].filter(Boolean);
    return parts.join(' ') || 'Пользователь';
  }

  public getDisplayName(): string {
    return this.username ? `@${this.username}` : this.getFullName();
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isModerator(): boolean {
    return this.role === UserRole.MODERATOR || this.role === UserRole.ADMIN;
  }

  public isPremium(): boolean {
    return this.is_premium || false;
  }

  public getStatusLevel(): number {
    switch (this.status) {
      case UserStatus.BRONZE: return 1;
      case UserStatus.SILVER: return 2;
      case UserStatus.GOLD: return 3;
      case UserStatus.PLATINUM: return 4;
      default: return 0;
    }
  }

  public canReceiveMessages(): boolean {
    return this.allows_write_to_pm || false;
  }

  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() };
    // Remove sensitive fields from JSON output
    return values;
  }

  public toPublicJSON(): Partial<UserAttributes> {
    const values = this.toJSON() as any;
    // Remove sensitive fields from public API responses
    if (values) {
      delete values.registration_ip;
      delete values.utm_campaign_id;
      delete values.normalized_phone;
    }
    return values;
  }
}

// Initialize the model to match your existing table
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    telegram_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    middle_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: [0, 100],
      },
    },
    language_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'ru',
    },
    is_premium: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'user',
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    birthdate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    consent_personal_data: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    consent_marketing: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    photo_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    allows_write_to_pm: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    bonus: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 100,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'Bronze',
    },
    total_spent: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    bonus_easter_egg: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    has_seen_tour: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    referral_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    referred_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    referral_bonus_received: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    total_referrals: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    registration_ip: {
      type: DataTypes.INET,
      allowNull: true,
    },
    utm_campaign_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    normalized_phone: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    position: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['telegram_id'],
        where: {
          telegram_id: { [Op.ne]: null },
        },
      },
      {
        fields: ['username'],
      },
      {
        fields: ['role'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['referral_code'],
      },
      {
        fields: ['referred_by'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['last_login'],
      },
    ],
    hooks: {
      beforeUpdate: (user: User) => {
        // Sequelize automatically handles updated_at timestamp
      },
    },
  }
);

// Определяем связи
User.belongsTo(StatusConfig, {
  foreignKey: 'status',
  targetKey: 'status_name',
  as: 'statusConfig'
});

StatusConfig.hasMany(User, {
  foreignKey: 'status',
  sourceKey: 'status_name',
  as: 'users'
});

export default User;
