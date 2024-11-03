import fs from 'fs'; // Import the fs module for file system operations
import path from 'path'; // Import the path module to handle file paths
import url from 'url'; // Import url for converting paths to URLs
import sequelize from './config/db.js'; // Import your Sequelize instance

const initializeDatabase = async () => {
  try {
    await sequelize.authenticate(); 
    console.log('Connection has been established successfully.');
    const modelsDir = path.join(process.cwd(), 'src/models');
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file);
      const fileUrl = url.pathToFileURL(filePath).href;
      await import(fileUrl);
    }

    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
};

export default initializeDatabase;
