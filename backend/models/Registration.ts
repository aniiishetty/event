import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { College } from './College'; // Import College model

interface RegistrationAttributes {
  id?: number;
  name: string;
  designation: string;
  collegeId: number;
  phone: string;
  email: string;
  photo?: Buffer;
  reason: 'To know about International Internship' | 'To know about Textbook' | 'To present research paper';
  researchPaper?: Buffer; // New field for the research paper file
}

interface RegistrationCreationAttributes extends Optional<RegistrationAttributes, 'id' | 'photo' | 'researchPaper'> {}

class Registration extends Model<RegistrationAttributes, RegistrationCreationAttributes> implements RegistrationAttributes {
  public id?: number;
  public name!: string;
  public designation!: string;
  public collegeId!: number;
  public phone!: string;
  public email!: string;
  public photo?: Buffer;
  public reason!: 'To know about International Internship' | 'To know about Textbook' | 'To present research paper';
  public researchPaper?: Buffer; // New field for the research paper file
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
      type: DataTypes.STRING,
      allowNull: false,
    },
    collegeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Colleges', // Table name
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
      type: DataTypes.ENUM('To know about International Internship', 'To know about Textbook', 'To present research paper'),
      allowNull: false,
    },
    researchPaper: {
      type: DataTypes.BLOB('long'), // Allows uploading files up to a certain size
      allowNull: true, // Only allow if reason is "To present research paper"
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
