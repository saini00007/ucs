// seeds/roles.js
import Role from '../models/Role'; 

const seedRoles = async () => {
  try {
 
    const roles = [
      { roleId: 1, roleName: 'superadmin' }, 
      { roleId: 2, roleName: 'admin' },       
      { roleId: 3, roleName: 'department_manager' }, 
      { roleId: 4, roleName: 'assessor' },    
      { roleId: 5, roleName: 'reviewer' },     
      { roleId: 6, roleName: 'report_viewer' }, 
      { roleId: 7, roleName: 'guest_user' },    
    ];

    for (const role of roles) {
      await Role.upsert(role);
      console.log(`Role ${role.roleName} inserted with ID: ${role.roleId}`); 
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

export default seedRoles;
