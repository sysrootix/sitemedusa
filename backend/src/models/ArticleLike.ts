import { DataTypes, Model } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';

interface ArticleLikeAttributes {
  id: string;
  article_id: string;
  user_id: string;
  created_at: Date;
}

interface ArticleLikeCreationAttributes extends Omit<ArticleLikeAttributes, 'id' | 'created_at'> {}

class ArticleLike extends Model<ArticleLikeAttributes, ArticleLikeCreationAttributes> implements ArticleLikeAttributes {
  public id!: string;
  public article_id!: string;
  public user_id!: string;

  // Timestamps
  public readonly created_at!: Date;

  // Associations
  public likeUser?: User;
  public article?: any;

  // Instance methods
  public toJSON(): Partial<ArticleLikeAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

ArticleLike.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    article_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'articles',
        key: 'id',
      },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ArticleLike',
    tableName: 'article_likes',
    timestamps: false, // Only created_at, no updated_at needed
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['article_id', 'user_id'], // Prevent duplicate likes
      },
      {
        fields: ['article_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleLike;
