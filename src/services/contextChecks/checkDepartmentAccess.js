import { Department } from "../../models/index.js";
import { checkAccessScope } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkDepartmentAccess = async (user, resourceId) => {
    try {
        const department = await Department.findByPk(resourceId);

        if (!department) {
            // If the department is not found, throw an error
            throw new AppError('Department not found', 404);
        }

        const accessScope = checkAccessScope(user, department.companyId, department.id);
        if (!accessScope.success) {
            // If access scope is not granted, throw an error
            throw new AppError('Access denied: insufficient access scope', 403);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking department access:", error);
        throw error;
    }
};

export default checkDepartmentAccess;
