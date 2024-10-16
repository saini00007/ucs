// initializeDatabase.js
import sequelize from './config/db.js'; // Adjust the path as necessary

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync all models with the database
    await sequelize.sync(); //Change this to { alter: true } or remove it for production
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default initializeDatabase;
