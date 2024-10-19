import User from '../models/User';
import bcrypt from 'bcrypt';
import Role from '../models/Role';

const seedSuperAdmins = async () => {
  try {
const hashedPassword = await bcrypt.hash("blabla", 10);    
    // Fetch the roleId for superadmin from the roles table
    const superAdminRole = await Role.findOne({ where: { roleName: 'superadmin' } });
    
    const superAdminData = {
      userId: 'abcd12345678',
      username: 'root',
      password: hashedPassword, // Use the hashed password
      email: 'sarjeetsingh4680@gmail.com',
      roleId: superAdminRole ? superAdminRole.roleId : null,
      departmentId: null,
      companyId: null,
    };

    const [superAdmin, created] = await User.findOrCreate({
      where: { username: superAdminData.username }, // Check for existing user by username
      defaults: superAdminData,
    });

    if (created) {
      console.log('Super admin inserted with user ID:', superAdmin.userId);
    } else {
      console.log('Super admin already exists with username:', superAdmin.username);
    }
  } catch (error) {
    console.error('Error seeding super admins:', error.message || error);
  }
};

export default seedSuperAdmins;
