import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';

interface ArticleCommentAttributes {
  id: string;
  article_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  is_approved: boolean;
  is_spam: boolean;
  like_count: number;
  reply_count: number;
  depth: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

interface ArticleCommentCreationAttributes extends Optional<ArticleCommentAttributes,
  'id' | 'parent_id' | 'is_approved' | 'is_spam' | 'created_at' | 'updated_at' | 'deleted_at'
> {}

class ArticleComment extends Model<ArticleCommentAttributes, ArticleCommentCreationAttributes> implements ArticleCommentAttributes {
  public id!: string;
  public article_id!: string;
  public author_id!: string;
  public parent_id?: string;
  public content!: string;
  public is_approved!: boolean;
  public is_spam!: boolean;
  public like_count!: number;
  public reply_count!: number;
  public depth!: number;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public deleted_at?: Date;

  // Associations
  public author?: User;
  public article?: any;
  public parent?: ArticleComment;
  public replies?: ArticleComment[];

  // Instance methods
  public isRootComment(): boolean {
    return !this.parent_id;
  }

  public isReply(): boolean {
    return !!this.parent_id;
  }

  public canHaveReplies(): boolean {
    return this.depth < 5; // Maximum nesting level
  }

  public incrementLikeCount(): Promise<ArticleComment> {
    return this.increment('like_count', { by: 1 });
  }

  public decrementLikeCount(): Promise<ArticleComment> {
    return this.decrement('like_count', { by: 1 });
  }

  public incrementReplyCount(): Promise<ArticleComment> {
    return this.increment('reply_count', { by: 1 });
  }

  public decrementReplyCount(): Promise<ArticleComment> {
    return this.decrement('reply_count', { by: 1 });
  }

  public approve(): Promise<ArticleComment> {
    return this.update({ is_approved: true });
  }

  public markAsSpam(): Promise<ArticleComment> {
    return this.update({ is_spam: true });
  }

  public getThreadPath(): string[] {
    // This would need to be implemented with a recursive query
    // For now, return basic path info
    return [this.id];
  }

  public toJSON(): Partial<ArticleCommentAttributes> {
    const values = { ...this.get() };
    return values;
  }

  public toPublicJSON(): Partial<ArticleCommentAttributes> {
    const values = this.toJSON() as any;
    // Remove sensitive fields from public API responses
    return values;
  }
}

ArticleComment.init(
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
    parent_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'article_comments',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 2000], // Reasonable comment length limit
      },
    },
    is_approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_spam: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    like_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    reply_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    depth: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 5,
      },
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
    modelName: 'ArticleComment',
    tableName: 'article_comments',
    timestamps: true,
    underscored: true,
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        fields: ['article_id'],
      },
      {
        fields: ['author_id'],
      },
      {
        fields: ['parent_id'],
      },
      {
        fields: ['is_approved'],
      },
      {
        fields: ['is_spam'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['depth'],
      },
    ],
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleComment;
