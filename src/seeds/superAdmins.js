import { User, Role } from '../models/index.js';
import sequelize from '../config/db.js';
import bcrypt from 'bcrypt';

const seedSuperAdmins = async () => {
  const transaction = await sequelize.transaction();
  try {
    const superAdminsData = [
      {
        id: 'abcd12345678',
        firstName: 'superadmin',
        middleName:'empty',
        lastName:'empty',
        email: 'testingbygeek@gmail.com',
        password: 'root@7ji',
      }
    ];

    for (const superAdminData of superAdminsData) {
      const existingSuperAdmin = await User.findOne({
        where: { email: superAdminData.email },
        transaction,
      });

      if (existingSuperAdmin) {
        console.log(`Super admin already exists with username: ${existingSuperAdmin.username}`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

      const newSuperAdminData = {
        ...superAdminData,
        password: hashedPassword,
        roleId: 'superadmin',
        companyId: null,
      };

      const superAdmin = await User.create(newSuperAdminData, { transaction });
      console.log(`Super admin inserted with user ID: ${superAdmin.id}`);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error('Error seeding super admins:', error.message || error);
  }
};

export default seedSuperAdmins;
