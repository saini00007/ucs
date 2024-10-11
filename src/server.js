import express from 'express';
import { connectToDatabase } from './db/db.js'; 
import path from 'path';
import cookieParser from 'cookie-parser';

import routes from './routes/temp.js'; 
import companyRoutes from './routes/company.js'; 
import departmentRoutes from './routes/department.js'; 
import userRoutes from './routes/user.js'; 
import authRoutes from './routes/auth.js'; 
import templateRoutes from './routes/template.js'; 
import assessmentRoutes from'./routes/assessment.js';
import assessmentQuestionRoutes from './routes/assessmentQuestion.js';
import answerRoutes from './routes/answer.js';

import { mockAuthenticate } from './middleware/mockAuth.js'; // Import mock authentication middleware
import dotenv from 'dotenv'; // Import dotenv for environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; 

// Middleware to parse JSON
app.use(express.json());
app.use(cookieParser());
// Middleware for mock authentication
// app.use(mockAuthenticate);

// Define the routes
app.use('/', routes); // Temporary routes
app.use('/companies', companyRoutes); // Routes for company operations
app.use('/', departmentRoutes); // Routes for department operations
app.use('/', userRoutes); // Routes for user operations
app.use('/auth', authRoutes); // Routes for authentication operations
app.use('/templates', templateRoutes); // Routes for template operations
app.use('/assessment',assessmentRoutes);
app.use('/question',assessmentQuestionRoutes);
app.use('/answer',answerRoutes);

// Connect to PostgreSQL
connectToDatabase(); // Establish the database connection

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
