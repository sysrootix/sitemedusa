import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface CatalogProductAttributes {
  id: string;
  shop_code: string;
  name: string;
  category_name?: string | null;
  category_id?: string | null;
  retail_price?: number | null;
  quanty?: number | null;
  characteristics?: any | null;
  modifications?: any | null;
  shop_name?: string | null;
  is_active: boolean;
  last_updated: Date;
  created_at: Date;
}

type CatalogProductCreationAttributes = Optional<
  CatalogProductAttributes,
  'category_name' | 'category_id' | 'retail_price' | 'quanty' | 'characteristics' | 'modifications' | 'shop_name' | 'is_active' | 'last_updated' | 'created_at'
>;

class CatalogProduct extends Model<CatalogProductAttributes, CatalogProductCreationAttributes> implements CatalogProductAttributes {
  public id!: string;
  public shop_code!: string;
  public name!: string;
  public category_name?: string | null;
  public category_id?: string | null;
  public retail_price?: number | null;
  public quanty?: number | null;
  public characteristics?: any | null;
  public modifications?: any | null;
  public shop_name?: string | null;
  public is_active!: boolean;

  public readonly last_updated!: Date;
  public readonly created_at!: Date;
}

CatalogProduct.init(
  {
    id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
    },
    shop_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    category_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    retail_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    quanty: {
      type: DataTypes.DECIMAL(10, 3),
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
    shop_name: {
      type: DataTypes.STRING(255),
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
    modelName: 'CatalogProduct',
    tableName: 'catalog_products',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'] },
      { fields: ['category_name'] },
      { fields: ['category_id'] },
      { fields: ['shop_code'] },
      { fields: ['is_active'] },
      { fields: ['retail_price'] },
      { fields: ['quanty'] },
      { fields: ['last_updated'] },
    ],
  }
);

export default CatalogProduct;
