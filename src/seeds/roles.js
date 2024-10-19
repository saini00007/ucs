// seeds/roles.js
import Role from '../models/Role';

const seedRoles = async () => {
  try {
    const roles = [
      { roleName: 'superadmin' },
      { roleName: 'admin' },
      { roleName: 'department_manager' },
      { roleName: 'assessor' },
      { roleName: 'reviewer' },
      { roleName: 'report_viewer' },
      { roleName: 'guest_user' },
    ];

    for (const role of roles) {
      const roleInfo = await Role.create(role); // Use create instead of upsert
      console.log(`Role ${roleInfo.roleName} inserted with ID: ${roleInfo.roleId}`);
    }

  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

export default seedRoles;
