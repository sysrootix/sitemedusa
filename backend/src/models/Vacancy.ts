import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface VacancyAttributes {
  id: string;
  image_url?: string;
  title: string;
  description: string;
  salary?: string;
  created_at: Date;
  updated_at: Date;
}

interface VacancyCreationAttributes extends Optional<VacancyAttributes,
  'id' | 'image_url' | 'salary' | 'created_at' | 'updated_at'
> {}

class Vacancy extends Model<VacancyAttributes, VacancyCreationAttributes> implements VacancyAttributes {
  public id!: string;
  public image_url?: string;
  public title!: string;
  public description!: string;
  public salary?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public toJSON(): Partial<VacancyAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

Vacancy.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    salary: {
      type: DataTypes.STRING,
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
    modelName: 'Vacancy',
    tableName: 'vacancies',
    timestamps: true,
    underscored: true,
  }
);

export default Vacancy;
