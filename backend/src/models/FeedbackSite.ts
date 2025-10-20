import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

export enum FeedbackStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Feedback attributes interface
interface FeedbackSiteAttributes {
  id: string;
  name: string;
  telegram?: string;
  phone?: string;
  subject: string;
  message: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  assigned_to?: string;
  notes?: string;
  response_sent?: boolean;
  response_date?: Date;
  created_at: Date;
  updated_at: Date;
  ip_address?: string;
  user_agent?: string;
}

// Creation attributes
interface FeedbackSiteCreationAttributes extends Optional<FeedbackSiteAttributes,
  'id' | 'telegram' | 'phone' | 'assigned_to' | 'notes' | 'response_sent' | 'response_date' |
  'created_at' | 'updated_at' | 'ip_address' | 'user_agent'
> {}

// Feedback model class
class FeedbackSite extends Model<FeedbackSiteAttributes, FeedbackSiteCreationAttributes> implements FeedbackSiteAttributes {
  public id!: string;
  public name!: string;
  public telegram?: string;
  public phone?: string;
  public subject!: string;
  public message!: string;
  public status!: FeedbackStatus;
  public priority!: FeedbackPriority;
  public assigned_to?: string;
  public notes?: string;
  public response_sent?: boolean;
  public response_date?: Date;
  public ip_address?: string;
  public user_agent?: string;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Instance methods
  public isPending(): boolean {
    return this.status === FeedbackStatus.PENDING;
  }

  public isCompleted(): boolean {
    return this.status === FeedbackStatus.COMPLETED;
  }

  public markAsCompleted(): void {
    this.status = FeedbackStatus.COMPLETED;
    this.response_sent = true;
    this.response_date = new Date();
  }

  public assignTo(userId: string): void {
    this.assigned_to = userId;
    this.status = FeedbackStatus.IN_PROGRESS;
  }

  public toJSON(): Partial<FeedbackSiteAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

// Initialize the model
FeedbackSite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    telegram: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255],
      },
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        len: [0, 50],
      },
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(FeedbackStatus)),
      allowNull: false,
      defaultValue: FeedbackStatus.PENDING,
    },
    priority: {
      type: DataTypes.ENUM(...Object.values(FeedbackPriority)),
      allowNull: false,
      defaultValue: FeedbackPriority.MEDIUM,
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    response_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.INET,
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'FeedbackSite',
    tableName: 'feedback_site',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['status'],
      },
      {
        fields: ['priority'],
      },
      {
        fields: ['assigned_to'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['name'],
      },
      {
        fields: ['telegram'],
      },
      {
        fields: ['phone'],
      },
    ],
  }
);

export default FeedbackSite;
