import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';

interface ArticleViewAttributes {
  id: string;
  article_id: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  viewed_at: Date;
  session_id?: string;
}

interface ArticleViewCreationAttributes extends Optional<ArticleViewAttributes, 'id' | 'user_id' | 'ip_address' | 'user_agent' | 'referrer' | 'session_id'> {}

class ArticleView extends Model<ArticleViewAttributes, ArticleViewCreationAttributes> implements ArticleViewAttributes {
  public id!: string;
  public article_id!: string;
  public user_id?: string;
  public ip_address?: string;
  public user_agent?: string;
  public referrer?: string;
  public viewed_at!: Date;
  public session_id?: string;

  // Associations
  public viewUser?: User;
  public article?: any;

  // Instance methods
  public isAnonymous(): boolean {
    return !this.user_id;
  }

  public isUniqueView(): boolean {
    // This would typically be determined by comparing with existing views
    // For now, assume all views are unique unless specified otherwise
    return true;
  }

  public getViewSource(): string {
    if (this.referrer) {
      // Parse referrer to determine source
      if (this.referrer.includes('google.com')) return 'google';
      if (this.referrer.includes('yandex.ru')) return 'yandex';
      if (this.referrer.includes('facebook.com')) return 'facebook';
      if (this.referrer.includes('twitter.com')) return 'twitter';
      return 'referral';
    }
    return 'direct';
  }

  public toJSON(): Partial<ArticleViewAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

ArticleView.init(
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
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    referrer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    viewed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    session_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ArticleView',
    tableName: 'article_views',
    timestamps: false, // viewed_at serves as timestamp
    underscored: true,
    indexes: [
      {
        fields: ['article_id'],
      },
      {
        fields: ['user_id'],
      },
      {
        fields: ['ip_address'],
      },
      {
        fields: ['viewed_at'],
      },
      {
        fields: ['session_id'],
      },
      {
        unique: true,
        fields: ['article_id', 'user_id', 'session_id'],
        where: {
          user_id: { [require('sequelize').Op.ne]: null },
        },
      },
      {
        unique: true,
        fields: ['article_id', 'ip_address', 'session_id'],
        where: {
          ip_address: { [require('sequelize').Op.ne]: null },
        },
      },
    ],
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleView;
