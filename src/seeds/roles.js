import Role from '../models/Role';

const seedRoles = async () => {
  try {
    const roles = [
      { roleName: 'superAdmin' },
      { roleName: 'admin' },
      { roleName: 'departmentManager' },
      { roleName: 'assessor' },
      { roleName: 'reviewer' },
      { roleName: 'reportViewer' },
      { roleName: 'guestUser' },
    ];

    for (const role of roles) {
      const roleId = role.roleName.toLowerCase();
      console.log(`Checking for existing role with roleId: ${roleId}`);


      const existingRole = await Role.findOne({ where: { id:roleId } });

      if (!existingRole) {
        const newRole = await Role.create({ id:roleId, roleName: role.roleName });
        console.log(`Role ${newRole.roleName} inserted with ID: ${newRole.id}`);
      } else {
        console.log(`Role ${existingRole.roleName} already exists with ID: ${existingRole.id}`);
      }
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

export default seedRoles;
