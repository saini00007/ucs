import sequelize from './config/db.js';
import './models/index.js';

const initializeDatabase = async () => {
  try {
    // Authenticate the connection to ensure it's working
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync all models with the database
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default initializeDatabase;