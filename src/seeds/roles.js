// seeds/roles.js
import Role from '../models/Role'; // Adjust the import path as necessary

const seedRoles = async () => {
  try {
    // Define the roles you want to insert
    const roles = [
      { role_id: 1, role_name: 'superadmin' },
      { role_id: 2, role_name: 'admin' },
      { role_id: 3, role_name: 'department_manager' },
      { role_id: 4, role_name: 'assessor' },
      { role_id: 5, role_name: 'reviewer' },
      { role_id: 6, role_name: 'report_viewer' },
      { role_id: 7, role_name: 'guest_user' },
    ];

    for (const role of roles) {
      // Create or update the role in the database
      await Role.upsert(role);
      console.log(`Role ${role.role_name} inserted with ID: ${role.role_id}`);
    }
  } catch (error) {
    console.error('Error seeding roles:', error);
  }
};

export default seedRoles;
