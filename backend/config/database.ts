import { Sequelize } from 'sequelize';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Debugging to ensure environment variables are loaded correctly
console.log(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST);

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

// Function to sync the database
async function synchronizeDatabase() {
  try {
    await sequelize.sync(); // Sync all defined models to the DB
    console.log('Database synchronized');
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
}

// Call the sync function
synchronizeDatabase();

export default sequelize;
