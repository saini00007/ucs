import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'Production';

// Sequelize instance to manage the database connection.
const sequelize = new Sequelize(
    isProduction ? process.env.RENDER_DB_URL : process.env.LOCAL_DB_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: isProduction ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {}, // No special options for non-production environments.
    logging: false, // Disable logging of SQL queries for cleaner console output.
}
);

export default sequelize;
