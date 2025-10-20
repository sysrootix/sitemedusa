import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable('cart_items', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
    });

    // Add indexes
    await queryInterface.addIndex('cart_items', ['user_id']);
    await queryInterface.addIndex('cart_items', ['product_id']);
    await queryInterface.addIndex('cart_items', ['user_id', 'product_id', 'shop_code', 'modification_id'], {
      unique: true,
      name: 'unique_cart_item',
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable('cart_items');
  },
};

