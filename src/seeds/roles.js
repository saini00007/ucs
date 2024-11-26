import { Role } from '../models/index.js';
import sequelize from '../config/db.js';

const roles = [
  { id: 'superadmin', roleName: 'superAdmin' },
  { id: 'admin', roleName: 'admin' },
  { id: 'departmentmanager', roleName: 'departmentManager' },
  { id: 'assessor', roleName: 'assessor' },
  { id: 'reviewer', roleName: 'reviewer' },
];

const seedRoles = async () => {
  const transaction = await sequelize.transaction();
  try {
    for (const role of roles) {
      const [existingRole, created] = await Role.findOrCreate({
        where: { id: role.id },
        defaults: role,
        transaction,
      });
      if (created) {
        console.log(`Role ${role.roleName} inserted.`);
      } else {
        console.log(`Role ${role.roleName} already exists.`);
      }
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error seeding roles:', error);
  }
};

export default seedRoles;
