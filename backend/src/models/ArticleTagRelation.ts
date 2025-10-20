import { DataTypes, Model } from 'sequelize';
import sequelize from '@/config/database';

interface ArticleTagRelationAttributes {
  id: string;
  article_id: string;
  tag_id: string;
  created_at: Date;
}

interface ArticleTagRelationCreationAttributes extends Omit<ArticleTagRelationAttributes, 'id' | 'created_at'> {}

class ArticleTagRelation extends Model<ArticleTagRelationAttributes, ArticleTagRelationCreationAttributes> implements ArticleTagRelationAttributes {
  public id!: string;
  public article_id!: string;
  public tag_id!: string;

  // Timestamps
  public readonly created_at!: Date;

  // Associations
  public article?: any;
  public tag?: any;

  // Instance methods
  public toJSON(): Partial<ArticleTagRelationAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

ArticleTagRelation.init(
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
    tag_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'article_tags',
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
    modelName: 'ArticleTagRelation',
    tableName: 'article_tag_relations',
    timestamps: false, // Only created_at
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['article_id', 'tag_id'], // Prevent duplicate relations
      },
      {
        fields: ['article_id'],
      },
      {
        fields: ['tag_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

export default ArticleTagRelation;
