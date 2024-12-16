import fs from 'fs';
import path from 'path';
import url from 'url';
import sequelize from './config/db.js';
import AppError from './utils/AppError.js';

const initializeDatabase = async () => {
  try {
    // Authenticate the connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Directory containing the model files
    const modelsDir = path.join(process.cwd(), 'src/models');

    // Read the directory and filter for JavaScript files only
    const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

    // Loop through each model file and import them dynamically
    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file);
      const fileUrl = url.pathToFileURL(filePath).href;
      await import(fileUrl);
    }

    // Sync all models with the database
    await sequelize.sync();
    console.log('✅ All models were synchronized successfully.');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw new AppError('Database initialization failed', 500);
  }
};

export default initializeDatabase;
