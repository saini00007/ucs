import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const isDevelopment = process.env.NODE_ENV === 'development';
const databaseUrl = isDevelopment ? process.env.LOCAL_DB_URL : process.env.RENDER_DB_URL;

if (!databaseUrl) {
    throw new Error(`Database URL not found for ${process.env.NODE_ENV} environment`);
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false,
//     dialectOptions: {
//         ssl: {
//             require: true,
//         rejectUnauthorized: false
//     },
//     connectTimeout: 60000
// },
    pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
},
    retry: {
    max: 3
}
});

export default sequelize;