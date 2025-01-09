import { Assessment, Department } from "../../models/index.js";
import { checkAccessScope, checkAccessScopeForDepartment } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkAssessmentAccess = async (user, resourceId) => {
    try {
        const assessment = await Assessment.findByPk(resourceId, {
            include: {
                model: Department,
                as: 'department',
            }
        });

        if (!assessment) {
            throw new AppError('Assessment not found', 404);
        }

        const { companyId, id: departmentId } = assessment.department;

        // Check access scope
        const accessScope = checkAccessScopeForDepartment(user, companyId, departmentId);
        if (!accessScope.success) {
            throw new AppError('Access denied: insufficient permissions', 403);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking assessment access:", error);
        throw error;
    }
};

export default checkAssessmentAccess;
