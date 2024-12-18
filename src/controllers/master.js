import { Role, MasterDepartment, IndustrySector } from '../models/index.js';
import AppError from '../utils/AppError.js';

export const getRoles = async (req, res, next) => {
    try {
        // Retrieve all roles from the database
        const roles = await Role.findAll();

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
            messages: filteredRoles.length === 0 ?
                ['No roles found'] :
                ['Roles retrieved successfully'],
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

        // Return successful response
        res.status(200).json({
            success: true,
            messages: [masterDepartments.length === 0 ? 'No master departments found' : 'Master departments retrieved successfully'],
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

        // Return successful response
        res.status(200).json({
            success: true,
            messages: [industrySectors.length === 0 ? 'No industry sectors found' : 'Industry Sectors retrieved successfully'],
            industrySectors,
        });

    } catch (error) {
        next(error);
    }
};

