import { Department } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

const checkDepartmentAccess = async (user, resourceId) => {
    try {
        const department = await Department.findByPk(resourceId);

        if (!department) {
            return createResponse(false, "Access denied: Department not found.", 404);
        }

        if (user.roleId === 'superadmin') {
            return createResponse(true, "Access granted", 200);
        }

        const companyId = department.companyId;
        const departmentId = department.id;

        if (user.roleId === 'admin') {
            const hasAccess = companyId === user.companyId;
            if (!hasAccess) {
                return createResponse(false, "Access denied: Admin does not belong to the company.", 403);
            }
            return createResponse(true, "Access granted", 200);
        }

        const userDepartments = user.departments.map(department => department.id);

        const hasAccess = userDepartments.includes(departmentId);
        if (!hasAccess) {
            return createResponse(false, "Access denied: User does not belong to the department.", 403);
        }

        return createResponse(true, "Access granted", 200);

    } catch (error) {
        console.error("Error checking department access:", error);
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkDepartmentAccess;
