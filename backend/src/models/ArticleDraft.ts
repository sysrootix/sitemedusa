import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';
import ArticleCategory from './ArticleCategory';

interface ArticleDraftAttributes {
  id: string;
  article_id?: string;
  author_id: string;
  title?: string;
  content?: string;
  excerpt?: string;
  category_id?: string;
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  meta_tags?: object;
  auto_saved: boolean;
  last_modified: Date;
  created_at: Date;
  expires_at?: Date;
}

interface ArticleDraftCreationAttributes extends Optional<ArticleDraftAttributes,
  'id' | 'article_id' | 'title' | 'content' | 'excerpt' | 'category_id' | 'featured_image' |
  'seo_title' | 'seo_description' | 'seo_keywords' | 'meta_tags' | 'expires_at' | 'created_at'
> {}

class ArticleDraft extends Model<ArticleDraftAttributes, ArticleDraftCreationAttributes> implements ArticleDraftAttributes {
  public id!: string;
  public article_id?: string;
  public author_id!: string;
  public title?: string;
  public content?: string;
  public excerpt?: string;
  public category_id?: string;
  public featured_image?: string;
  public seo_title?: string;
  public seo_description?: string;
  public seo_keywords?: string;
  public meta_tags?: object;
  public auto_saved!: boolean;
  public last_modified!: Date;

  // Timestamps
  public readonly created_at!: Date;
  public expires_at?: Date;

  // Associations
  public author?: User;
  public category?: ArticleCategory;
  public article?: any;

  // Instance methods
  public isExpired(): boolean {
    return this.expires_at ? new Date() > this.expires_at : false;
  }

  public isAutoSaved(): boolean {
    return this.auto_saved;
  }

  public hasContent(): boolean {
    return !!(this.title || this.content || this.excerpt);
  }

  public getWordCount(): number {
    if (!this.content) return 0;
    return this.content.split(/\s+/).filter(word => word.length > 0).length;
  }

  public updateLastModified(): Promise<ArticleDraft> {
    return this.update({ last_modified: new Date() });
  }

  public extendExpiry(days: number = 30): Promise<ArticleDraft> {
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + days);
    return this.update({ expires_at: newExpiry });
  }

  public toJSON(): Partial<ArticleDraftAttributes> {
    const values = { ...this.get() };
    return values;
  }

  public toPublicJSON(): Partial<ArticleDraftAttributes> {
    const values = this.toJSON() as any;
    // Add computed fields for public API
    (values as any).word_count = this.getWordCount();
    (values as any).has_content = this.hasContent();
    (values as any).is_expired = this.isExpired();
    return values;
  }

  // Static methods
  public static cleanupExpired(): Promise<number> {
    return this.destroy({
      where: {
        expires_at: {
          [require('sequelize').Op.lt]: new Date(),
        },
      },
    });
  }

  public static findByAuthor(authorId: string, limit: number = 10): Promise<ArticleDraft[]> {
    return this.findAll({
      where: { author_id: authorId },
      order: [['last_modified', 'DESC']],
      limit,
      include: [
        { model: User, as: 'draftAuthor', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: ArticleCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
    });
  }
}

ArticleDraft.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    article_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'articles',
        key: 'id',
      },
    },
    author_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    excerpt: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'article_categories',
        key: 'id',
      },
    },
    featured_image: {
      type: DataTypes.STRING(500),
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
    auto_saved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_modified: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ArticleDraft',
    tableName: 'article_drafts',
    timestamps: false, // We handle timestamps manually with last_modified
    underscored: true,
    indexes: [
      {
        fields: ['article_id'],
      },
      {
        fields: ['author_id'],
      },
      {
        fields: ['last_modified'],
      },
      {
        fields: ['expires_at'],
      },
      {
        fields: ['auto_saved'],
      },
    ],
    hooks: {
      beforeCreate: (draft: ArticleDraft) => {
        // Set default expiry to 30 days from creation if not specified
        if (!draft.expires_at) {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 30);
          draft.expires_at = expiry;
        }
      },
      beforeUpdate: (draft: ArticleDraft) => {
        // Update last_modified on any change
        draft.last_modified = new Date();
      },
    },
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleDraft;
