import { DataTypes, Model, Optional, Op } from 'sequelize';
import sequelize from '@/config/database';

interface PromotionAttributes {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  starts_at: Date;
  ends_at?: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface PromotionCreationAttributes extends Optional<PromotionAttributes,
  'id' | 'image_url' | 'ends_at' | 'created_at' | 'updated_at'
> {}

class Promotion extends Model<PromotionAttributes, PromotionCreationAttributes> implements PromotionAttributes {
  public id!: string;
  public title!: string;
  public description!: string;
  public image_url?: string;
  public starts_at!: Date;
  public ends_at?: Date | null;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Instance methods
  public isActive(): boolean {
    const now = new Date();
    return this.starts_at <= now && (!this.ends_at || this.ends_at > now);
  }

  public isExpired(): boolean {
    return this.ends_at ? this.ends_at <= new Date() : false;
  }

  public isUpcoming(): boolean {
    return this.starts_at > new Date();
  }

  public toJSON(): Partial<PromotionAttributes> {
    const values = { ...this.get() };
    return values;
  }

  public toPublicJSON(): Partial<PromotionAttributes> {
    const values = this.toJSON() as any;
    return values;
  }

  public static findActive(): Promise<Promotion[]> {
    return this.findAll({
      where: {
        ends_at: null,
        starts_at: {
          [Op.lte]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });
  }

  public static findActiveWithExpiration(): Promise<Promotion[]> {
    return this.findAll({
      where: {
        [Op.or]: [
          { ends_at: null },
          {
            ends_at: {
              [Op.gt]: new Date(),
            },
          },
        ],
        starts_at: {
          [Op.lte]: new Date(),
        },
      },
      order: [['created_at', 'DESC']],
    });
  }
}

Promotion.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    starts_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    ends_at: {
      type: DataTypes.DATE,
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
  },
  {
    sequelize,
    modelName: 'Promotion',
    tableName: 'promotions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['starts_at'],
      },
      {
        fields: ['ends_at'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['updated_at'],
      },
    ],
  }
);

export default Promotion;
