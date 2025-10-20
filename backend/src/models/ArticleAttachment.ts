import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';
import User from './User';

interface ArticleAttachmentAttributes {
  id: string;
  article_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  caption?: string;
  sort_order: number;
  is_featured: boolean;
  uploaded_by: string;
  created_at: Date;
  updated_at: Date;
}

interface ArticleAttachmentCreationAttributes extends Optional<ArticleAttachmentAttributes,
  'id' | 'alt_text' | 'caption' | 'created_at' | 'updated_at'
> {}

class ArticleAttachment extends Model<ArticleAttachmentAttributes, ArticleAttachmentCreationAttributes> implements ArticleAttachmentAttributes {
  public id!: string;
  public article_id!: string;
  public file_name!: string;
  public file_path!: string;
  public file_size!: number;
  public mime_type!: string;
  public alt_text?: string;
  public caption?: string;
  public sort_order!: number;
  public is_featured!: boolean;
  public uploaded_by!: string;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public uploader?: User;
  public article?: any;

  // Instance methods
  public isImage(): boolean {
    return this.mime_type.startsWith('image/');
  }

  public isVideo(): boolean {
    return this.mime_type.startsWith('video/');
  }

  public isAudio(): boolean {
    return this.mime_type.startsWith('audio/');
  }

  public isDocument(): boolean {
    return ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(this.mime_type);
  }

  public getFileExtension(): string {
    return this.file_name.split('.').pop()?.toLowerCase() || '';
  }

  public getFormattedFileSize(): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = this.file_size;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  public getPublicUrl(): string {
    // This would typically generate a public URL for the file
    return `/uploads/articles/${this.article_id}/${this.file_name}`;
  }

  public toJSON(): Partial<ArticleAttachmentAttributes> {
    const values = { ...this.get() };
    return values;
  }

  public toPublicJSON(): Partial<ArticleAttachmentAttributes> {
    const values = this.toJSON() as any;
    // Add computed fields for public API
    (values as any).formatted_file_size = this.getFormattedFileSize();
    (values as any).public_url = this.getPublicUrl();
    (values as any).file_type = this.getFileType();
    return values;
  }

  private getFileType(): string {
    if (this.isImage()) return 'image';
    if (this.isVideo()) return 'video';
    if (this.isAudio()) return 'audio';
    if (this.isDocument()) return 'document';
    return 'file';
  }
}

ArticleAttachment.init(
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
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    alt_text: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    caption: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_featured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    uploaded_by: {
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
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'ArticleAttachment',
    tableName: 'article_attachments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['article_id'],
      },
      {
        fields: ['uploaded_by'],
      },
      {
        fields: ['mime_type'],
      },
      {
        fields: ['sort_order'],
      },
      {
        fields: ['is_featured'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);

// Associations are defined in models/index.ts to avoid duplicates

export default ArticleAttachment;
