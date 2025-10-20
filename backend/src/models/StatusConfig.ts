import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

// StatusConfig attributes interface
interface StatusConfigAttributes {
  id: string;
  status_name: string;
  min_spent: number;
  bonus_percent: number;
  display_name: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  is_discount_only: boolean;
  discount_multiplier: number;
}

// Creation attributes
interface StatusConfigCreationAttributes
  extends Optional<StatusConfigAttributes, 'id' | 'emoji' | 'sort_order' | 'is_active' | 'created_at' | 'updated_at' | 'is_discount_only' | 'discount_multiplier'> {}

// StatusConfig model class
class StatusConfig extends Model<StatusConfigAttributes, StatusConfigCreationAttributes> implements StatusConfigAttributes {
  public id!: string;
  public status_name!: string;
  public min_spent!: number;
  public bonus_percent!: number;
  public display_name!: string;
  public emoji?: string;
  public sort_order!: number;
  public is_active!: boolean;
  public is_discount_only!: boolean;
  public discount_multiplier!: number;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// Initialize the model
StatusConfig.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    status_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    min_spent: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    bonus_percent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    display_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    emoji: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    is_discount_only: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    discount_multiplier: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: false,
      defaultValue: 0.00,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'StatusConfig',
    tableName: 'status_config',
    timestamps: true,
    underscored: true,
  }
);

export default StatusConfig;
