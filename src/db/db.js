import pkg from 'pg'; // Import PostgreSQL client
import dotenv from 'dotenv'; // Import dotenv for environment variables

// Load environment variables from .env file
dotenv.config();

// Destructure the Pool from the imported package
const { Pool } = pkg;

// Create a new PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/ucs',
});

// Function to execute a query
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params)
    return res;
  } catch (err) {
    console.error('Query error', err.stack);
    throw err; // Rethrow the error for handling in the calling function
  }
};

// Function to connect to the database
const connectToDatabase = async () => {
  try {
    await pool.connect();
    console.log('Connected to PostgreSQL database successfully');
  } catch (err) {
    console.error('Error connecting to the database', err.stack);
  }
};

// Function to end the pool when the server is shutting down
const endPool = async () => {
  try {
    await pool.end();
    console.log('PostgreSQL pool has been closed');
  } catch (err) {
    console.error('Error closing the pool', err.stack);
  }
};

// Export the query function, connectToDatabase function, and endPool function
export { query, connectToDatabase, endPool };
