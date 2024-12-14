import { Department } from "../../models/index.js";
import { checkAccessScope } from "../../utils/accessValidators.js";

const checkDepartmentAccess = async (user, resourceId) => {
    try {
        const department = await Department.findByPk(resourceId);

        if (!department) {
            return {
                success: false,
                message: 'Department not found',
                status: 404
            };
        }

        const accessScope = checkAccessScope(user, department.companyId, department.id);
        if (!accessScope.success) {
            return { success: false };
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking department access:", error);
        return {
            success: false,
            message: 'Internal server error',
            status: 500
        };
    }
};

export default checkDepartmentAccess;
