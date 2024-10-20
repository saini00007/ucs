import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv'; // Import dotenv for environment variables
import fs from 'fs'; // Import fs for file system operations
import url from 'url'; // Import url for converting paths to URLs
import sequelize from './config/db.js'; // Import the Sequelize instance
import initializeDatabase from './initializeDatabase.js'; // Import the database initialization function
// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 443; 

import mockAuthenticate from './middleware/mockAuth.js';
import { authenticate } from './middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;


import companyRoutes from './routes/company.js'; 
import departmentRoutes from './routes/department.js'; 
import userRoutes from './routes/user.js'; 
import authRoutes from './routes/auth.js'; 
import assessmentRoutes from'./routes/assessment.js';
import assessmentQuestionRoutes from './routes/assessmentQuestion.js';
import answerRoutes from './routes/answer.js';
import masterRoutes from './routes/master.js'
import masterQuestionRoute from './routes/masterQuestion.js';

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());

// Dynamically import all models


app.use('/', authRoutes); // Routes for authentication operations
app.use(authMiddleware);
app.use('/', companyRoutes); // Routes for company operations
app.use('/', departmentRoutes); // Routes for department operations
app.use('/', userRoutes); // Routes for user operations
app.use('/',assessmentRoutes);
app.use('/',assessmentQuestionRoutes);
app.use('/',answerRoutes);
app.use('/',masterRoutes);
app.use('/',masterQuestionRoute);

const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
