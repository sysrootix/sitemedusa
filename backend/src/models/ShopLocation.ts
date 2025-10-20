import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface ShopLocationAttributes {
  id: number;
  shop_code: string;
  shop_name: string;
  address?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  twogis_url?: string | null;
  yandex_maps_url?: string | null;
  google_maps_url?: string | null;
  phone?: string | null;
  working_hours?: string | null;
  description?: string | null;
  is_active?: boolean | null;
  priority_order?: number | null;
  created_at?: Date | null;
  updated_at?: Date | null;
}

type ShopLocationCreationAttributes = Optional<ShopLocationAttributes, 'id' | 'address' | 'city' | 'latitude' | 'longitude' | 'twogis_url' | 'yandex_maps_url' | 'google_maps_url' | 'phone' | 'working_hours' | 'description' | 'is_active' | 'priority_order' | 'created_at' | 'updated_at'>;

class ShopLocation extends Model<ShopLocationAttributes, ShopLocationCreationAttributes> implements ShopLocationAttributes {
  public id!: number;
  public shop_code!: string;
  public shop_name!: string;
  public address?: string | null;
  public city?: string | null;
  public latitude?: number | null;
  public longitude?: number | null;
  public twogis_url?: string | null;
  public yandex_maps_url?: string | null;
  public google_maps_url?: string | null;
  public phone?: string | null;
  public working_hours?: string | null;
  public description?: string | null;
  public is_active?: boolean | null;
  public priority_order?: number | null;

  public readonly created_at?: Date | null;
  public readonly updated_at?: Date | null;
}

ShopLocation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    shop_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    shop_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: 'Хабаровск',
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      allowNull: true,
    },
    twogis_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    yandex_maps_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    google_maps_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    working_hours: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
    priority_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    modelName: 'ShopLocation',
    tableName: 'shop_locations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['is_active'] },
      { fields: ['city'] },
      { fields: ['priority_order'] },
      { fields: ['latitude', 'longitude'] },
    ],
  }
);

export default ShopLocation;


