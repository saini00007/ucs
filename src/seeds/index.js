import sequelize from '../config/db.js';
import express from 'express';
import dotenv from 'dotenv';
import seedRoles from './roles.js';
import seedResources from './resources.js';
import seedActions from './actions.js';
import seedSuperAdmins from './superAdmins.js';
import seedMasterDepartments from './masterDepartments.js';
import seedMasterQuestions from './masterQuestions.js';
import seedRoleResourceActionLinks from './roleResourceActionLinks.js';
import seedControlFrameworks from './controlFrameworks.js';
import initializeDatabase from '../initializeDatabase.js';
import seedIndustrySectors from './industrySectors.js';
import seedMasterSubDepartments from './masterSubDepartment.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const runSeeds = async () => {
    const transaction = await sequelize.transaction();
    try {
        await seedRoles({ transaction });
         await seedResources({ transaction });
        await seedActions({ transaction });
        await seedRoleResourceActionLinks({ transaction });

        await seedSuperAdmins({ transaction });
        await seedMasterSubDepartments({ transaction });
        await seedMasterDepartments({ transaction });

        await seedIndustrySectors({ transaction });

        await seedControlFrameworks({ transaction });

        await seedMasterQuestions();

        await transaction.commit();
        console.log('Seeding completed successfully!');
    } catch (error) {
        await transaction.rollback();
        console.error('Error occurred during seeding:', error.message || error);
        throw error;
    }
};

const startServerAndSeed = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, async () => {
            console.log(`Server is running on port ${PORT}`);
            await runSeeds();
            process.exit(0);
        });
    } catch (error) {
        console.error('Failed to start server or seed data:', error);
        process.exit(1);
    }
};

startServerAndSeed();
