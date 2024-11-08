import Role from '../models/Role';

const roles = [
  { id: 'superadmin', roleName: 'superAdmin' },
  { id: 'admin', roleName: 'admin' },
  { id: 'departmentmanager', roleName: 'departmentManager' },
  { id: 'assessor', roleName: 'assessor' },
  { id: 'reviewer', roleName: 'reviewer' },
  { id: 'reportviewer', roleName: 'reportViewer' },
  { id: 'guestuser', roleName: 'guestUser' },
];

const seedRoles = async () => {
  for (const role of roles) {
    const [existingRole, created] = await Role.findOrCreate({
      where: { id: role.id },
      defaults: role,
    });
    if (created) {
      console.log(`Role ${role.roleName} inserted.`);
    } else {
      console.log(`Role ${role.roleName} already exists.`);
    }
  }
};

export default seedRoles;
