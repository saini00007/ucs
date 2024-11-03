import { Role, MasterDepartment } from '../models/index.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.findAll();
    
    if (roles.length === 0) {
      return res.status(404).json({ success: false, message: ['No roles found'] });
    }

    let filteredRoles;

    if (req.user.roleId === 'superadmin') {
      filteredRoles = roles;
    } else if (req.user.roleId === 'admin') {
      filteredRoles = roles.filter(role => role.id !== 'superadmin' && role.id !== 'admin');
    } else {
      filteredRoles = [];
    }

    res.status(200).json({
      success: true,
      message: ['Roles retrieved successfully'],
      roles: filteredRoles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ success: false, message: ['Error fetching roles'] });
  }
};


export const getMasterDepartments = async (req, res) => {
  try {
    const masterDepartments = await MasterDepartment.findAll();

    if (masterDepartments.length === 0) {
      return res.status(404).json({ success: false, message: ['No master departments found'] });
    }

    res.status(200).json({
      success: true,
      message: ['Master departments retrieved successfully'],
      masterDepartments,
    });
  } catch (error) {
    console.error('Error fetching master departments:', error);
    res.status(500).json({ success: false, message: ['Error fetching master departments'] });
  }
};
