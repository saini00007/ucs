import { MasterDepartment } from '../models/index.js';
import sequelize from '../config/db.js';

const seedMasterDepartments = async () => {
  const departments = [
    'Business Continuity',
    'Business Operations',
    'Cybersecurity',
    'Facilities Management',
    'Finance',
    'Human Resources',
    'Information Security',
    'IT Operations',
    'Legal',
    'Network Security',
    'Physical Security',
    'Procurement'
  ];

  const transaction = await sequelize.transaction();
  try {
    for (const departmentName of departments) {
      const [department, created] = await MasterDepartment.findOrCreate({
        where: { departmentName },
        defaults: { departmentName },
        transaction,
      });

      if (created) {
        console.log(`Department "${departmentName}" inserted with Department ID ${department.departmentId}`);
      } else {
        console.log(`Department "${departmentName}" already exists.`);
      }
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error seeding master departments:', error);
  }
};

export default seedMasterDepartments;
