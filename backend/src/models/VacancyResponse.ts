import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '@/config/database';

interface VacancyResponseAttributes {
  id: string;
  full_name: string;
  phone: string;
  username?: string;
  vacancy_title: string;
  file_path?: string;
  file_name?: string;
  file_mime?: string;
  text?: string;
  created_at: Date;
}

interface VacancyResponseCreationAttributes extends Optional<VacancyResponseAttributes,
  'id' | 'username' | 'file_path' | 'file_name' | 'file_mime' | 'text' | 'created_at'
> {}

class VacancyResponse extends Model<VacancyResponseAttributes, VacancyResponseCreationAttributes> implements VacancyResponseAttributes {
  public id!: string;
  public full_name!: string;
  public phone!: string;
  public username?: string;
  public vacancy_title!: string;
  public file_path?: string;
  public file_name?: string;
  public file_mime?: string;
  public text?: string;
  public readonly created_at!: Date;

  public toJSON(): Partial<VacancyResponseAttributes> {
    const values = { ...this.get() };
    return values;
  }
}

VacancyResponse.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    vacancy_title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    file_mime: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'VacancyResponse',
    tableName: 'vacancy_responses',
    timestamps: false,
  }
);

export default VacancyResponse;
