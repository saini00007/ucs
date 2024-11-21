import User from '../models/User';
import bcrypt from 'bcrypt';
import Role from '../models/Role';

const seedSuperAdmins = async () => {
  try {

    const superAdminsData = [
      {
        id: 'abcd12345678',
        username: 'root',
        email: 'testingbygeek@gmail.com',
        phoneNumber: '1234567890',
        password: 'root',
      },
      {
        id: 'efgh23456789',
        username: 'admin1',
        email: 'admin1@example.com',
        password: 'admin1Pass456',

      },
      {
        id: 'ijkl34567890',
        username: 'admin2',
        email: 'admin2@example.com',
        phoneNumber: '1122334455',
        password: 'admin2Pass789',

      },
    ];

    for (const superAdminData of superAdminsData) {
      const existingSuperAdmin = await User.findOne({ where: { username: superAdminData.username } });

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

      const superAdmin = await User.create(newSuperAdminData);
      console.log(`Super admin inserted with user ID: ${superAdmin.id}`);
    }

  } catch (error) {
    console.error('Error seeding super admins:', error.message || error);
  }
};

export default seedSuperAdmins;
