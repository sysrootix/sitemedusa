import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CartItemAttributes {
  id: string;
  user_id: string;
  product_id: string;
  shop_code: string;
  modification_id?: string | null;
  quantity: number;
  price: number;
  created_at?: Date;
  updated_at?: Date;
}

interface CartItemCreationAttributes extends Optional<CartItemAttributes, 'id' | 'created_at' | 'updated_at' | 'modification_id'> {}

class CartItem extends Model<CartItemAttributes, CartItemCreationAttributes> implements CartItemAttributes {
  public id!: string;
  public user_id!: string;
  public product_id!: string;
  public shop_code!: string;
  public modification_id!: string | null;
  public quantity!: number;
  public price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    shop_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    modification_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
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
    tableName: 'cart_items',
    underscored: true,
    timestamps: true,
  }
);

export default CartItem;

