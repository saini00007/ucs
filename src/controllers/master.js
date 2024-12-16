import { Role, MasterDepartment, IndustrySector } from '../models/index.js';
import AppError from '../utils/AppError.js';

export const getRoles = async (req, res, next) => {
    try {
        // Retrieve all roles from the database
        const roles = await Role.findAll();

        // If no roles found
        if (roles.length === 0) {
            throw new AppError('No roles found', 404);
        }

        let filteredRoles;
        const userRole = req.user.roleId;

        // Filter roles based on user's role
        switch (userRole) {
            case 'superadmin':
                filteredRoles = roles;
                break;

            case 'admin':
                filteredRoles = roles.filter(role => 
                    !['superadmin', 'admin'].includes(role.id)
                );
                break;

            case 'departmentmanager':
                filteredRoles = roles.filter(role => 
                    !['superadmin', 'admin', 'departmentmanager'].includes(role.id)
                );
                break;

            default:
                filteredRoles = [];
        }

        // Return the filtered roles
        res.status(200).json({
            success: true,
            messages: filteredRoles.length ? 
                ['Roles retrieved successfully'] : 
                ['No roles available for your access level'],
            roles: filteredRoles,
        });

    } catch (error) {
        next(error);
    }
};

export const getMasterDepartments = async (req, res, next) => {
  try {
      // Fetch all master departments
      const masterDepartments = await MasterDepartment.findAll();

      // If no master departments found
      if (masterDepartments.length === 0) {
          throw new AppError('No master departments found', 404);
      }

      // Return successful response
      res.status(200).json({
          success: true,
          messages: ['Master departments retrieved successfully'],
          masterDepartments,
      });

  } catch (error) {
      next(error);
  }
};

export const getIndustrySectors = async (req, res, next) => {
  try {
      // Fetch all industry sectors
      const industrySectors = await IndustrySector.findAll();

      // If no industry sectors found
      if (industrySectors.length === 0) {
          throw new AppError('No industry sectors found', 404);
      }

      // Return successful response
      res.status(200).json({
          success: true,
          messages: ['Industry Sectors retrieved successfully'],
          industrySectors,
      });

  } catch (error) {
      next(error);
  }
};

