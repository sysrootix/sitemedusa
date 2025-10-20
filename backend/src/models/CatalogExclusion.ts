import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CatalogExclusionAttributes {
  id: number;
  exclusion_type: string;
  item_id: string;
  reason: string | null;
  created_at: Date;
  created_by: string | null;
  is_active: boolean;
}

interface CatalogExclusionCreationAttributes
  extends Optional<CatalogExclusionAttributes, 'id' | 'reason' | 'created_at' | 'created_by' | 'is_active'> {}

class CatalogExclusion extends Model<CatalogExclusionAttributes, CatalogExclusionCreationAttributes> implements CatalogExclusionAttributes {
  public id!: number;
  public exclusion_type!: string;
  public item_id!: string;
  public reason!: string | null;
  public created_at!: Date;
  public created_by!: string | null;
  public is_active!: boolean;
}

CatalogExclusion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    exclusion_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'catalog_exclusions',
    timestamps: false,
  }
);

export default CatalogExclusion;
