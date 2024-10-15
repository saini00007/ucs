import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv'; // Import dotenv for environment variables
import fs from 'fs'; // Import fs for file system operations
import url from 'url'; // Import url for converting paths to URLs
import sequelize from './config/db.js'; // Import the Sequelize instance
import initializeDatabase from './initializeDatabase.js'; // Import the database initialization function
import mockAuthenticate from './middleware/mockAuth.js';
// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; 


import companyRoutes from './routes/company.js'; 
import departmentRoutes from './routes/department.js'; 
import userRoutes from './routes/user.js'; 
import authRoutes from './routes/auth.js'; 
import assessmentRoutes from'./routes/assessment.js';
import assessmentQuestionRoutes from './routes/assessmentQuestion.js';
import answerRoutes from './routes/answer.js';

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());
app.use(mockAuthenticate);

// Dynamically import all models
const importModels = async () => {
  const modelsDir = path.join(process.cwd(), 'src/models'); // Adjust the path as necessary
  const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

  for (const file of modelFiles) {
    const filePath = path.join(modelsDir, file);
    const fileUrl = url.pathToFileURL(filePath).href; // Convert to file:// URL
    await import(fileUrl); // Import each model file
  }
};


app.use('/', companyRoutes); // Routes for company operations
app.use('/', departmentRoutes); // Routes for department operations
app.use('/', userRoutes); // Routes for user operations
app.use('/', authRoutes); // Routes for authentication operations
app.use('/',assessmentRoutes);
app.use('/',assessmentQuestionRoutes);
app.use('/',answerRoutes);

const startServer = async () => {
  try {
    await importModels(); // Import all models
    await initializeDatabase(); // Initialize and sync database models
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
