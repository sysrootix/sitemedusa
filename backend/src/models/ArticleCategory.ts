import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface ArticleCategoryAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface ArticleCategoryCreationAttributes extends Optional<ArticleCategoryAttributes, 'id' | 'description' | 'color' | 'icon' | 'parent_id' | 'created_at' | 'updated_at'> {}

class ArticleCategory extends Model<ArticleCategoryAttributes, ArticleCategoryCreationAttributes> implements ArticleCategoryAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description?: string;
  public color?: string;
  public icon?: string;
  public parent_id?: string;
  public sort_order!: number;
  public is_active!: boolean;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public parentCategory?: ArticleCategory;
  public childCategories?: ArticleCategory[];
  public articles?: any[]; // Will be defined when Article model is created

  // Instance methods
  public getFullPath(): string {
    if (this.parentCategory) {
      return `${this.parentCategory.getFullPath()} > ${this.name}`;
    }
    return this.name;
  }

  public getDepth(): number {
    if (this.parentCategory) {
      return this.parentCategory.getDepth() + 1;
    }
    return 0;
  }

  public toJSON(): Partial<ArticleCategoryAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

ArticleCategory.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 100],
        is: /^[a-z0-9-]+$/i,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i,
      },
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sort_order: {
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
    modelName: 'ArticleCategory',
    tableName: 'article_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['parent_id'],
      },
      {
        fields: ['sort_order'],
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

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleCategory;
