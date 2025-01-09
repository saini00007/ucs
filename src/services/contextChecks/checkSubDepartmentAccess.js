import { SubDepartment, Department, SubAssessment, Assessment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkSubDepartmentAccess = async (user, resourceId) => {
    try {
        const subDepartment = await SubDepartment.findByPk(resourceId, {
            include: [{
                model: Department,
                as: 'department',
                attributes: ['id', 'companyId']
            }]
        });

        if (!subDepartment) {
            throw new AppError('SubDepartment not found', 404);
        }

        const companyId = subDepartment.department.companyId;
        const departmentId = subDepartment.department.id;
        const subDepartmentId = subDepartment.id;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId, subDepartmentId);
        if (!accessScope.success) {
            throw new AppError('Access denied: insufficient permissions', 403);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking subdepartment access:", error);
        throw error;
    }
};
export default checkSubDepartmentAccess;