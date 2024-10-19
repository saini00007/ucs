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
      const [roleInfo, created] = await Role.findOrCreate({
        where: { roleName: role.roleName },
        defaults: role,
      });
      if (created) {
        console.log(`Role ${roleInfo.roleName} inserted with ID: ${roleInfo.roleId}`);
      } else {
        console.log(`Role ${roleInfo.roleName} already exists.`);
      }
    }

  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

export default seedRoles;
