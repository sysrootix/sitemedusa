import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CatalogCategoryAttributes {
  id: string;
  shop_code: string;
  name: string;
  parent_id: string | null;
  parent_shop_code: string | null;
  level: number;
  full_path: string | null;
  quanty: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

interface CatalogCategoryCreationAttributes
  extends Optional<CatalogCategoryAttributes, 'parent_id' | 'parent_shop_code' | 'level' | 'full_path' | 'quanty' | 'is_active' | 'sort_order' | 'created_at' | 'updated_at'> {}

class CatalogCategory extends Model<CatalogCategoryAttributes, CatalogCategoryCreationAttributes> implements CatalogCategoryAttributes {
  public id!: string;
  public shop_code!: string;
  public name!: string;
  public parent_id!: string | null;
  public parent_shop_code!: string | null;
  public level!: number;
  public full_path!: string | null;
  public quanty!: number | null;
  public is_active!: boolean;
  public sort_order!: number;
  public created_at!: Date;
  public updated_at!: Date;
}

CatalogCategory.init(
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
    name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    parent_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    parent_shop_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    full_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    quanty: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'catalog_categories',
    timestamps: false,
    indexes: [
      { fields: ['shop_code'] },
      { fields: ['parent_id', 'parent_shop_code'] },
      { fields: ['name'] },
      { fields: ['level'] },
      { fields: ['is_active'] },
      { fields: ['shop_code', 'parent_id', 'sort_order'] },
    ],
  }
);

export default CatalogCategory;

