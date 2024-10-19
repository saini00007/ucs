import fs from 'fs'; // Import the fs module for file system operations
import path from 'path'; // Import the path module to handle file paths
import url from 'url'; // Import url for converting paths to URLs
import sequelize from './config/db.js'; // Import your Sequelize instance

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate(); // Authenticate the connection
    console.log('Connection has been established successfully.');

    const modelsDir = path.join(process.cwd(), 'src/models'); // Adjust the path as necessary
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

    // Import each model file
    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file);
      const fileUrl = url.pathToFileURL(filePath).href; // Convert to file:// URL
      await import(fileUrl); // Import each model file
    }

    await sequelize.sync(); // Sync all models
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default initializeDatabase;
