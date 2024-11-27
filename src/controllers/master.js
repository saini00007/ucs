import { Role, MasterDepartment } from '../models/index.js';

export const getRoles = async (req, res) => {
  try {
    // Retrieve all roles from the database
    const roles = await Role.findAll();

    // If no roles are found, return a 404 response
    if (roles.length === 0) {
      return res.status(404).json({ success: false, messages: ['No roles found'] });
    }

    let filteredRoles;

    // Check the user's role to determine which roles they are authorized to see
    if (req.user.roleId === 'superadmin') {
      // Superadmins can view all roles
      filteredRoles = roles;
    } else if (req.user.roleId === 'admin') {
      // Admins can view all roles except 'superadmin' and 'admin'
      filteredRoles = roles.filter(role => role.id !== 'superadmin' && role.id !== 'admin');
    } else if (req.user.roleId === 'departmentmanager') {
      // Department managers can view all roles except 'superadmin', 'admin', and 'departmentmanager'
      filteredRoles = roles.filter(role => role.id !== 'superadmin' && role.id !== 'admin' && role.id !== 'departmentmanager');
    } else {
      // Users with other roles will see an empty list
      filteredRoles = [];
    }

    // Return the filtered list of roles
    res.status(200).json({
      success: true,
      messages: ['Roles retrieved successfully'],
      roles: filteredRoles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error); // Log the error for debugging purposes
    // Return a 500 response in case of error while fetching roles
    res.status(500).json({ success: false, messages: ['Error fetching roles'] });
  }
};

export const getMasterDepartments = async (req, res) => {
  try {
    // Fetch all master departments from the database
    const masterDepartments = await MasterDepartment.findAll();

    // If no master departments are found, return a 404 response
    if (masterDepartments.length === 0) {
      return res.status(404).json({ success: false, messages: ['No master departments found'] });
    }

    // Return the list of master departments in the response
    res.status(200).json({
      success: true,
      messages: ['Master departments retrieved successfully'],
      masterDepartments,
    });
  } catch (error) {
    console.error('Error fetching master departments:', error); // Log the error for debugging purposes
    // Return a 500 response if there was an issue fetching the master departments
    res.status(500).json({ success: false, messages: ['Error fetching master departments'] });
  }
};

