import User from '../models/User';
import bcrypt from 'bcrypt';
import Role from '../models/Role';

const seedSuperAdmins = async () => {
  try {
    const hashedPassword = await bcrypt.hash("root", 10);    
    const superAdminRole = await Role.findOne({ where: { id: 'superadmin' } });

    if (!superAdminRole) {
      console.error('Superadmin role not found');
      return;
    }
    const superAdminData = {
      id: 'abcd12345678',
      username: 'root',
      password: hashedPassword,
      email: 'testingbygeek@gmail.com',
      roleId: superAdminRole.id,
      departmentId: null,
      companyId: null,
      phoneNumber: '1234567890'
    };

    const existingSuperAdmin = await User.findOne({ where: { username: superAdminData.username } });

    if (existingSuperAdmin) {
      console.log('Super admin already exists with username:', existingSuperAdmin.username);
      return;
    }
    const superAdmin = await User.create(superAdminData);
    console.log('Super admin inserted with user ID:', superAdmin.id);

  } catch (error) {
    console.error('Error seeding super admins:', error.message || error);
  }
};

export default seedSuperAdmins;
