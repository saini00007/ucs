// seeds/index.js
import seedRoles from './roles.js';
import seedSuperAdmins from './superAdmins.js';
import seedMasterDepartments from './masterDepartments.js';
import seedMasterQuestions from './masterQuestions.js';

const runSeeds = async () => {
     await seedRoles();
     await seedSuperAdmins();
     await seedMasterDepartments();
    await seedMasterQuestions('./final2.xlsx');
};

runSeeds()
    .then(() => console.log('Seeding completed successfully!'))
    .catch(err => console.error('Error during seeding:', err));
