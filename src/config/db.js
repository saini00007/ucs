import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

// Fetch database connection details from environment variables
const username = process.env.DB_USERNAME;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_DATABASE;
const host = process.env.DB_HOST;
const dialect = process.env.DB_DIALECT;

// Create a new Sequelize instance
const sequelize = new Sequelize(database, username, password, {
  host,
  dialect,
  logging: false,
});

// Test the connection
try {
  await sequelize.authenticate();
  console.log('Connection has been established successfully.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

export default sequelize;
