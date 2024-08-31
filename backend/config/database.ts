import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';
import {College} from '../models/College'; // Import the College model
import {Registration} from '../models/Registration'; // Import the Registration model

dotenv.config();

console.log(process.env); // Debugging to ensure environment variables are loaded

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

// Define the associations between models
College.hasMany(Registration, { foreignKey: 'collegeId' });
Registration.belongsTo(College, { foreignKey: 'collegeId' });

// Synchronize the database schema with the models
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Database synchronized');
  })
  .catch((error) => {
    console.error('Error synchronizing database:', error);
  });

export default sequelize;
