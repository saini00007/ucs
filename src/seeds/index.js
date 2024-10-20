import express from 'express';
import dotenv from 'dotenv';
import seedRoles from './roles.js';
import seedSuperAdmins from './superAdmins.js';
import seedMasterDepartments from './masterDepartments.js';
import seedMasterQuestions from './masterQuestions.js';
import initializeDatabase from '../initializeDatabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const runSeeds = async () => {
     await seedRoles();
    await seedSuperAdmins();
   await seedMasterDepartments();
    const useFakeData = true;
    const fakeDataCount = 20;
   await seedMasterQuestions();
};

const startServerAndSeed = async () => {
    try {
        await initializeDatabase();

        app.listen(PORT, async () => {
            console.log(`Server is running on port ${PORT}`);
            await runSeeds();
            console.log('Seeding completed successfully!');
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start server or seed data:', error);
        process.exit(1);
    }
};

startServerAndSeed();
