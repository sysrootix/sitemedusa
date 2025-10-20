import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CatalogItemAttributes {
  id: string;
  shop_code: string;
  category_id: string;
  name: string;
  slug: string | null;
  quanty: number | null;
  retail_price: number | null;
  characteristics: Record<string, any> | null;
  modifications: Record<string, any> | null;
  is_active: boolean;
  last_updated: Date;
  created_at: Date;
}

interface CatalogItemCreationAttributes
  extends Optional<CatalogItemAttributes, 'slug' | 'quanty' | 'retail_price' | 'characteristics' | 'modifications' | 'is_active' | 'last_updated' | 'created_at'> {}

class CatalogItem extends Model<CatalogItemAttributes, CatalogItemCreationAttributes> implements CatalogItemAttributes {
  public id!: string;
  public shop_code!: string;
  public category_id!: string;
  public name!: string;
  public slug!: string | null;
  public quanty!: number | null;
  public retail_price!: number | null;
  public characteristics!: Record<string, any> | null;
  public modifications!: Record<string, any> | null;
  public is_active!: boolean;
  public last_updated!: Date;
  public created_at!: Date;
}

CatalogItem.init(
  {
    id: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    shop_code: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(600),
      allowNull: true,
    },
    quanty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    retail_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    characteristics: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    modifications: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'catalog_items',
    timestamps: false,
    indexes: [
      { fields: ['shop_code'] },
      { fields: ['category_id', 'shop_code'] },
      { fields: ['name'] },
      { fields: ['slug'] },
      { fields: ['slug', 'shop_code'], unique: true },
      { fields: ['is_active'] },
      { fields: ['retail_price'] },
      { fields: ['last_updated'] },
    ],
  }
);

export default CatalogItem;

