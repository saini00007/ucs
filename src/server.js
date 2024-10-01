import express from 'express';
import { connectToDatabase } from './db/db.js'; // Import the connection function

import routes from './routes/temp.js';
import companyRoutes from './routes/company.js';
import departmentRoutes from './routes/department.js';


import { mockAuthenticate } from './middlewares/mockAuth.js';
import dotenv from 'dotenv'; // Import dotenv for environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000; // Use environment port or default to 3000
console.log(process.env.MAP);
// Middleware to parse JSON
app.use(express.json());

//mock authentication
app.use(mockAuthenticate);

app.use('/', routes);
app.use('/companies', companyRoutes);
app.use('/departments',departmentRoutes);

// Connect to PostgreSQL
connectToDatabase(); // Call the function to connect


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
