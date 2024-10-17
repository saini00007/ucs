// seeds/superAdmins.js
import User from '../models/User';
import bcrypt from 'bcrypt';

const seedSuperAdmins = async () => {
  try {
    const superAdminPassword = await bcrypt.hash('blabla', 10);

    const superAdminData = {
      userId: 'abcd12345678',          
      username: 'superAdmin',
      password: superAdminPassword,
      email: 'sarjeetsingh4680@gmail.com',
      roleId: 1,                       
      departmentId: null,              
      companyId: null,                 
    };

    const superAdmin = await User.create(superAdminData);
    console.log('Super admin inserted with user ID:', superAdmin.userId); 
  } catch (error) {
    console.error('Error seeding super admins:', error);
  }
};

export default seedSuperAdmins;
