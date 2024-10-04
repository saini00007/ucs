import express from 'express';
import { connectToDatabase } from './db/db.js'; // Import the connection function for the database

import routes from './routes/temp.js'; // Import temporary routes
import companyRoutes from './routes/company.js'; // Import company-related routes
import departmentRoutes from './routes/department.js'; // Import department-related routes
import userRoutes from './routes/user.js'; // Import user-related routes
import authRoutes from './routes/auth.js'; // Import authentication-related routes
import templateRoutes from './routes/template.js'; // Import template-related routes

import { mockAuthenticate } from './middlewares/mockAuth.js'; // Import mock authentication middleware
import dotenv from 'dotenv'; // Import dotenv for environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // Use environment port or default to 4000

// Middleware to parse JSON
app.use(express.json());

// Middleware for mock authentication
app.use(mockAuthenticate);

// Define the routes
app.use('/', routes); // Temporary routes
app.use('/companies', companyRoutes); // Routes for company operations
app.use('/', departmentRoutes); // Routes for department operations
app.use('/', userRoutes); // Routes for user operations
app.use('/auth', authRoutes); // Routes for authentication operations
app.use('/templates', templateRoutes); // Routes for template operations

// Connect to PostgreSQL
connectToDatabase(); // Establish the database connection

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
