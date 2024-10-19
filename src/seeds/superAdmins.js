// seeds/superAdmins.js
import User from '../models/User';
import bcrypt from 'bcrypt';
import Role from '../models/Role';

const seedSuperAdmins = async () => {
  try {
    const superAdminPassword = await bcrypt.hash('blabla', 10);
    
    // Fetch the roleId for superadmin from the roles table
    const superAdminRole = await Role.findOne({ where: { roleName: 'superadmin' } });
    
    const superAdminData = {
      userId: 'abcd12345678', // Consider generating this dynamically
      username: 'superAdmin',
      password: superAdminPassword,
      email: 'sarjeetsingh4680@gmail.com',
      roleId: superAdminRole ? superAdminRole.roleId : null,
      departmentId: null,
      companyId: null,
    };

    const superAdmin = await User.create(superAdminData);
    console.log('Super admin inserted with user ID:', superAdmin.userId);
  } catch (error) {
    console.error('Error seeding super admins:', error.message || error);
  }
};

export default seedSuperAdmins;
