import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';
import ArticleCategory from './ArticleCategory';

interface ArticleRevisionAttributes {
  id: string;
  article_id: string;
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
  revision_number: number;
  change_summary?: string;
  created_at: Date;
}

interface ArticleRevisionCreationAttributes extends Optional<ArticleRevisionAttributes,
  'id' | 'title' | 'content' | 'excerpt' | 'category_id' | 'featured_image' |
  'seo_title' | 'seo_description' | 'seo_keywords' | 'meta_tags' | 'change_summary' | 'created_at'
> {}

class ArticleRevision extends Model<ArticleRevisionAttributes, ArticleRevisionCreationAttributes> implements ArticleRevisionAttributes {
  public id!: string;
  public article_id!: string;
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
  public revision_number!: number;
  public change_summary?: string;

  // Timestamps
  public readonly created_at!: Date;

  // Associations
  public author?: User;
  public category?: ArticleCategory;
  public article?: any;

  // Instance methods
  public getChanges(): object {
    // This would compare with previous revision
    // For now, return basic change info
    return {
      revision_number: this.revision_number,
      change_summary: this.change_summary,
      changed_fields: this.getChangedFields(),
    };
  }

  private getChangedFields(): string[] {
    // This would analyze what fields changed
    // For now, return all possible fields
    const fields = [];
    if (this.title) fields.push('title');
    if (this.content) fields.push('content');
    if (this.excerpt) fields.push('excerpt');
    if (this.category_id) fields.push('category');
    if (this.featured_image) fields.push('featured_image');
    if (this.seo_title || this.seo_description || this.seo_keywords) fields.push('seo');
    return fields;
  }

  public getFormattedChangeSummary(): string {
    if (this.change_summary) {
      return this.change_summary;
    }
    const changedFields = this.getChangedFields();
    if (changedFields.length === 0) return 'Изменения не указаны';
    return `Изменены поля: ${changedFields.join(', ')}`;
  }

  public toJSON(): Partial<ArticleRevisionAttributes> {
    const values = { ...this.get() };
    return values;
  }

  public toPublicJSON(): Partial<ArticleRevisionAttributes> {
    const values = this.toJSON() as any;
    // Add computed fields for public API
    (values as any).formatted_change_summary = this.getFormattedChangeSummary();
    (values as any).changed_fields = this.getChangedFields();
    return values;
  }

  // Static methods
  public static getLatestRevision(articleId: string): Promise<ArticleRevision | null> {
    return this.findOne({
      where: { article_id: articleId },
      order: [['revision_number', 'DESC']],
    });
  }

  public static getRevisionCount(articleId: string): Promise<number> {
    return this.count({
      where: { article_id: articleId },
    });
  }

  public static getRevisions(articleId: string, limit: number = 10): Promise<ArticleRevision[]> {
    return this.findAll({
      where: { article_id: articleId },
      order: [['revision_number', 'DESC']],
      limit,
      include: [
        { model: User, as: 'revisionAuthor', attributes: ['id', 'username', 'first_name', 'last_name'] },
        { model: ArticleCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
      ],
    });
  }
}

ArticleRevision.init(
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
    revision_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    change_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ArticleRevision',
    tableName: 'article_revisions',
    timestamps: false, // Only created_at
    underscored: true,
    indexes: [
      {
        fields: ['article_id'],
      },
      {
        fields: ['author_id'],
      },
      {
        fields: ['revision_number'],
      },
      {
        fields: ['created_at'],
      },
      {
        unique: true,
        fields: ['article_id', 'revision_number'],
      },
    ],
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleRevision;
