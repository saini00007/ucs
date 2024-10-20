import User from '../models/User';
import bcrypt from 'bcrypt';
import Role from '../models/Role';

const seedSuperAdmins = async () => {
  try {
    const hashedPassword = await bcrypt.hash("root", 10);    
    const superAdminRole = await Role.findOne({ where: { roleName: 'superAdmin' } });
    
    console.log(superAdminRole.dataValues.roleId); 

    if (!superAdminRole) {
      console.error('Superadmin role not found');
      return;
    }

    // Extract roleId from the superAdminRole object
    const superAdminData = {
      userId: 'abcd12345678', // Ensure this is unique for each super admin
      username: 'root',
      password: hashedPassword,
      email: 'testingbygeek@gmail.com',
      roleId: superAdminRole.dataValues.roleId, // Extract the roleId as a string
      departmentId: null,
      companyId: null,
      phoneNumber: '1234567890'
    };

    const existingSuperAdmin = await User.findOne({ where: { username: superAdminData.username } });

    if (existingSuperAdmin) {
      console.log('Super admin already exists with username:', existingSuperAdmin.username);
      return;
    }

    // Create the super admin if not found
    const superAdmin = await User.create(superAdminData);
    console.log('Super admin inserted with user ID:', superAdmin.userId);

  } catch (error) {
    console.error('Error seeding super admins:', error.message || error);
  }
};

export default seedSuperAdmins;
