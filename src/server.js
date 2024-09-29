import express from 'express';
import { connectToDatabase } from './db/db.js'; // Import the connection function
import routes from './routes/temp.js';
import dotenv from 'dotenv'; // Import dotenv for environment variables

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000

// Middleware to parse JSON
app.use(express.json());

app.use('/', routes);

// Connect to PostgreSQL
connectToDatabase(); // Call the function to connect


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
