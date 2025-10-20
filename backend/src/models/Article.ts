import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';
import ArticleCategory from './ArticleCategory';

interface ArticleAttributes {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image?: string;
  author_id: string;
  category_id?: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  published_at?: Date | null;
  scheduled_at?: Date | null;
  is_featured: boolean;
  is_pinned: boolean;
  allow_comments: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  reading_time?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

interface ArticleCreationAttributes extends Optional<ArticleAttributes,
  'id' | 'excerpt' | 'featured_image' | 'category_id' | 'published_at' | 'scheduled_at' |
  'reading_time' | 'seo_title' | 'seo_description' | 'seo_keywords' | 'meta_tags' |
  'created_at' | 'updated_at' | 'deleted_at'
> {}

class Article extends Model<ArticleAttributes, ArticleCreationAttributes> implements ArticleAttributes {
  public id!: string;
  public title!: string;
  public slug!: string;
  public excerpt?: string;
  public content!: string;
  public featured_image?: string;
  public author_id!: string;
  public category_id?: string;
  public status!: 'draft' | 'published' | 'archived' | 'scheduled';
  public published_at?: Date | null;
  public scheduled_at?: Date | null;
  public is_featured!: boolean;
  public is_pinned!: boolean;
  public allow_comments!: boolean;
  public view_count!: number;
  public like_count!: number;
  public comment_count!: number;
  public share_count!: number;
  public reading_time?: number;
  public seo_title?: string;
  public seo_description?: string;
  public seo_keywords?: string;
  public meta_tags?: object;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public deleted_at?: Date | null;

  // Associations
  public author?: User;
  public category?: ArticleCategory;
  public tags?: any[];
  public comments?: any[];
  public likes?: any[];
  public views?: any[];
  public attachments?: any[];

  // Instance methods
  public isPublished(): boolean {
    return this.status === 'published' && this.published_at !== null;
  }

  public isScheduled(): boolean {
    return this.status === 'scheduled' && this.scheduled_at !== null;
  }

  public isDraft(): boolean {
    return this.status === 'draft';
  }

  public isArchived(): boolean {
    return this.status === 'archived';
  }

  public canBePublished(): boolean {
    return !!(this.title && this.content && this.slug);
  }

  public getEstimatedReadingTime(): number {
    if (this.reading_time) {
      return this.reading_time;
    }
    // Rough estimation: 200 words per minute
    const wordsCount = this.content.split(/\s+/).length;
    return Math.ceil(wordsCount / 200);
  }

  public incrementViewCount(): Promise<Article> {
    return this.increment('view_count', { by: 1 });
  }

  public incrementLikeCount(): Promise<Article> {
    return this.increment('like_count', { by: 1 });
  }

  public decrementLikeCount(): Promise<Article> {
    return this.decrement('like_count', { by: 1 });
  }

  public incrementCommentCount(): Promise<Article> {
    return this.increment('comment_count', { by: 1 });
  }

  public decrementCommentCount(): Promise<Article> {
    return this.decrement('comment_count', { by: 1 });
  }

  public incrementShareCount(): Promise<Article> {
    return this.increment('share_count', { by: 1 });
  }

  public getPublicUrl(): string {
    return `/articles/${this.slug}`;
  }

  public getExcerpt(length: number = 150): string {
    if (this.excerpt) {
      return this.excerpt;
    }
    // Extract first N characters from content, avoiding cutting words
    const plainText = this.content.replace(/<[^>]*>/g, '');
    if (plainText.length <= length) {
      return plainText;
    }
    return plainText.substring(0, length).replace(/\s+\S*$/, '') + '...';
  }

  public toJSON(): Partial<ArticleAttributes> {
    const values = { ...this.get() };
    return values;
  }

  public toPublicJSON(): Partial<ArticleAttributes> {
    const values = this.toJSON() as any;
    // Remove sensitive fields from public API responses
    return values;
  }

  public static findPublished(options?: any): Promise<Article[]> {
    return this.findAll({
      where: {
        status: 'published',
        published_at: {
          [Op.ne]: null,
          [Op.lte]: new Date(),
        },
      },
      ...options,
    });
  }

  public static findFeatured(limit: number = 5): Promise<Article[]> {
    return this.findAll({
      where: {
        status: 'published',
        is_featured: true,
        [Op.and]: [
          { published_at: { [Op.ne]: null } },
          { published_at: { [Op.lte]: new Date() } }
        ]
      },
      limit,
      order: [['published_at', 'DESC']],
    });
  }

  public static findByCategory(categoryId: string, options?: any): Promise<Article[]> {
    return this.findAll({
      where: {
        category_id: categoryId,
        status: 'published',
        published_at: {
          [Op.ne]: null,
          [Op.lte]: new Date(),
        },
      },
      ...options,
    });
  }

  public static search(query: string, options?: any): Promise<Article[]> {
    return this.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${query}%` } },
          { content: { [Op.iLike]: `%${query}%` } },
          { excerpt: { [Op.iLike]: `%${query}%` } },
          { seo_keywords: { [Op.iLike]: `%${query}%` } },
        ],
        status: 'published',
        published_at: {
          [Op.ne]: null,
          [Op.lte]: new Date(),
        },
      },
      ...options,
    });
  }
}

Article.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 200],
      },
    },
    slug: {
      type: DataTypes.STRING(200),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 200],
        is: /^[a-z0-9-]+$/i,
      },
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    featured_image: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'article_categories',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived', 'scheduled'),
      defaultValue: 'draft',
      allowNull: false,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_pinned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allow_comments: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    view_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    comment_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    share_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reading_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    seo_title: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    seo_description: {
      type: DataTypes.STRING(160),
      allowNull: true,
    },
    seo_keywords: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    meta_tags: {
      type: DataTypes.JSONB,
      allowNull: true,
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
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Article',
    tableName: 'articles',
    timestamps: true,
    underscored: true,
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        unique: true,
        fields: ['slug'],
      },
      {
        fields: ['author_id'],
      },
      {
        fields: ['category_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['published_at'],
      },
      {
        fields: ['scheduled_at'],
      },
      {
        fields: ['is_featured'],
      },
      {
        fields: ['is_pinned'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['updated_at'],
      },
      {
        fields: ['deleted_at'],
      },
      {
        fields: ['seo_keywords'],
        using: 'gin',
        operator: 'gin_trgm_ops',
      },
    ],
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default Article;
