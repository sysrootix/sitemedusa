import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface CatalogSyncLogAttributes {
  id: string;
  shop_code?: string | null;
  sync_type: string;
  status: 'started' | 'success' | 'failed' | 'partial';
  products_synced: number;
  products_added: number;
  products_updated: number;
  products_deactivated: number;
  error_message?: string | null;
  duration_ms?: number | null;
  started_at: Date;
  completed_at?: Date | null;
  created_at: Date;
}

type CatalogSyncLogCreationAttributes = Optional<
  CatalogSyncLogAttributes,
  'id' | 'shop_code' | 'products_synced' | 'products_added' | 'products_updated' | 'products_deactivated' | 'error_message' | 'duration_ms' | 'completed_at' | 'created_at'
>;

class CatalogSyncLog
  extends Model<CatalogSyncLogAttributes, CatalogSyncLogCreationAttributes>
  implements CatalogSyncLogAttributes
{
  public id!: string;
  public shop_code?: string | null;
  public sync_type!: string;
  public status!: 'started' | 'success' | 'failed' | 'partial';
  public products_synced!: number;
  public products_added!: number;
  public products_updated!: number;
  public products_deactivated!: number;
  public error_message?: string | null;
  public duration_ms?: number | null;
  public started_at!: Date;
  public completed_at?: Date | null;

  public readonly created_at!: Date;
}

CatalogSyncLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    shop_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sync_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('started', 'success', 'failed', 'partial'),
      allowNull: false,
    },
    products_synced: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    products_added: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    products_updated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    products_deactivated: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CatalogSyncLog',
    tableName: 'catalog_sync_log',
    timestamps: false, // We manage timestamps manually
    underscored: true,
    indexes: [
      { fields: ['shop_code'] },
      { fields: ['status'] },
      { fields: ['started_at'] },
    ],
  }
);

export default CatalogSyncLog;

