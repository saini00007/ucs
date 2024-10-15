// seeds/superAdmins.js
import User from '../models/User'; // Import your User model
import bcrypt from 'bcrypt';

const seedSuperAdmins = async () => {
  try {
    const superAdminPassword = await bcrypt.hash('blabla', 10);

    const superAdminData = {
      user_id: 'abcd12345678',
      username: 'superAdmin',
      password: superAdminPassword,
      email: 'sarjeetsingh4680@gmail.com',
      role_id: 1, // Assuming 1 is the role ID for admin
      department_id: null,
      company_id: null,
    };

    const superAdmin = await User.create(superAdminData);
    console.log('Super admin inserted with user ID:', superAdmin.user_id);
  } catch (error) {
    console.error('Error seeding super admins:', error);
  }
};

export default seedSuperAdmins;
