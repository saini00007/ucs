// src/config/db.js
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'Production';

const sequelize = new Sequelize(isProduction ? process.env.RENDER_DB_URL : process.env.LOCAL_DB_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: isProduction ? {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    } : {},
    logging: false,
});

export default sequelize;
