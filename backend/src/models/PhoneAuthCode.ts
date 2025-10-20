import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

// Phone auth code attributes interface
interface PhoneAuthCodeAttributes {
  id: string;
  phone: string;
  code: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
  updated_at: Date;
}

// Creation attributes (id is auto-generated)
interface PhoneAuthCodeCreationAttributes extends Optional<PhoneAuthCodeAttributes,
  'id' | 'used' | 'created_at' | 'updated_at'
> {}

// Phone auth code model class
class PhoneAuthCode extends Model<PhoneAuthCodeAttributes, PhoneAuthCodeCreationAttributes>
  implements PhoneAuthCodeAttributes {
  public id!: string;
  public phone!: string;
  public code!: string;
  public expires_at!: Date;
  public used!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Instance methods
  public isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  public isValid(): boolean {
    return !this.used && !this.isExpired();
  }
}

// Initialize the model
PhoneAuthCode.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [10, 20], // Allow international format
      },
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 6], // 6-digit code
        isNumeric: true,
      },
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    modelName: 'PhoneAuthCode',
    tableName: 'phone_auth_codes',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['phone'],
      },
      {
        fields: ['phone', 'used'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['code', 'phone', 'used'], // For validation
      },
    ],
  }
);

export default PhoneAuthCode;
