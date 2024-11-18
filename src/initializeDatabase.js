import fs from 'fs';
import path from 'path';
import url from 'url'; 
import sequelize from './config/db.js'; // Configured Sequelize instance.

const initializeDatabase = async () => {
  try {
    // Authenticate the connection to ensure it's working.
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Directory containing the model files.
    const modelsDir = path.join(process.cwd(), 'src/models');
    // Read the directory and filter for JavaScript files only.
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

    // Loop through each model file and import them dynamically.
    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file); // Full path to the file.
      const fileUrl = url.pathToFileURL(filePath).href; // Convert the path to a URL for import.
      await import(fileUrl); // Dynamically import the model file.
    }

    // Sync all models with the database, creating tables if they don't exist.
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default initializeDatabase;
