import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { College } from './College';

interface RegistrationAttributes {
  id?: number;
  name: string;
  designation: 'Chair Person' | 'Council Member' | 'Principal' | 'Vice-Chancellor';
  collegeId?: number | null; // Changed type to number | null
  phone: string;
  email: string;
  photo?: Buffer;
  reason: 'To know about International Internship' | 'To know about Textbook' | 'To present research paper';
  researchPaper?: Buffer;
  committeeMember?: string | null; 
}

interface RegistrationCreationAttributes extends Optional<RegistrationAttributes, 'id' | 'photo' | 'researchPaper' | 'collegeId' | 'committeeMember'> {}

class Registration extends Model<RegistrationAttributes, RegistrationCreationAttributes> implements RegistrationAttributes {
  public id?: number;
  public name!: string;
  public designation!: 'Chair Person' | 'Council Member' | 'Principal' | 'Vice-Chancellor';
  public collegeId?: number | null; // Changed type to number | null
  public phone!: string;
  public email!: string;
  public photo?: Buffer;
  public reason!: 'To know about International Internship' | 'To know about Textbook' | 'To present research paper';
  public researchPaper?: Buffer;
  public committeeMember?: string | null; 
}

Registration.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    designation: {
      type: DataTypes.ENUM('Chair Person', 'Council Member', 'Principal', 'Vice-Chancellor'),
      allowNull: false,
    },
    collegeId: {
      type: DataTypes.INTEGER,
      allowNull: true, 
      references: {
        model: 'colleges',
        key: 'id',
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    photo: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
    reason: {
      type: DataTypes.ENUM(
        'To know about International Internship',
        'To know about Textbook',
        'To present research paper'
      ),
      allowNull: false,
    },
    researchPaper: {
      type: DataTypes.BLOB('long'),
      allowNull: true,
    },
   committeeMember: {
      type: DataTypes.STRING,
      allowNull: true, 
    },
  },
  {
    sequelize,
    tableName: 'registrations',
    timestamps: true,
  }
);

Registration.belongsTo(College, { foreignKey: 'collegeId', as: 'college' });

export { Registration };
