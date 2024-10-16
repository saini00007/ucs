// src/config/db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv'; // Use ES module import
dotenv.config(); // Load environment variables

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(isProduction ? process.env.RENDER_DB_URL : process.env.LOCAL_DB_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: isProduction ? {
        ssl: {
            require: true,
            rejectUnauthorized: false // This is important for Render
        }
    } : {},
    logging: false, // Disable logging
});

export default sequelize; // Default export
