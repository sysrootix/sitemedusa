import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface ArticleTagAttributes {
  id: string;
  name: string;
  slug: string;
  color?: string;
  description?: string;
  usage_count: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ArticleTagCreationAttributes extends Optional<ArticleTagAttributes, 'id' | 'color' | 'description' | 'created_at' | 'updated_at'> {}

class ArticleTag extends Model<ArticleTagAttributes, ArticleTagCreationAttributes> implements ArticleTagAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public color?: string;
  public description?: string;
  public usage_count!: number;
  public is_active!: boolean;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public articles?: any[]; // Will be defined when Article model is created

  // Instance methods
  public incrementUsage(): Promise<ArticleTag> {
    return this.increment('usage_count', { by: 1 });
  }

  public decrementUsage(): Promise<ArticleTag> {
    return this.decrement('usage_count', { by: 1 });
  }

  public toJSON(): Partial<ArticleTagAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

ArticleTag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
      },
    },
    slug: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50],
        is: /^[a-z0-9-]+$/i,
      },
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    modelName: 'ArticleTag',
    tableName: 'article_tags',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['usage_count'],
      },
      {
        fields: ['is_active'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default ArticleTag;
