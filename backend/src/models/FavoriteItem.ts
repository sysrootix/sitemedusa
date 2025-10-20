import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface FavoriteItemAttributes {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_data: any;
  created_at: Date;
}

interface FavoriteItemCreationAttributes extends Optional<FavoriteItemAttributes, 'id' | 'created_at'> {}

class FavoriteItem extends Model<FavoriteItemAttributes, FavoriteItemCreationAttributes> implements FavoriteItemAttributes {
  public id!: string;
  public user_id!: string;
  public product_id!: string;
  public product_name!: string;
  public product_data!: any;
  public created_at!: Date;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

FavoriteItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    product_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    product_name: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    product_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'favorites',
    timestamps: false,
    indexes: [
      {
        name: 'idx_favorites_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_favorites_product_id',
        fields: ['product_id'],
      },
      {
        name: 'idx_favorites_created_at',
        fields: ['created_at'],
      },
      {
        name: 'favorites_user_id_product_id_unique',
        unique: true,
        fields: ['user_id', 'product_id'],
      },
    ],
  }
);

export default FavoriteItem;

