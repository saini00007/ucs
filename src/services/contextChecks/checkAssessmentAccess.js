import { Assessment, Department } from "../../models/index.js";
import { checkAccessScope } from "../../utils/accessValidators.js";

const checkAssessmentAccess = async (user, resourceId) => {
    try {
        const assessment = await Assessment.findByPk(resourceId, {
            include: {
                model: Department,
                as: 'department',
            }
        });

        if (!assessment) {
            return {
                success: false,
                message: 'Assessment not found',
                status: 404
            };
        }
        const { companyId, id: departmentId } = assessment.department;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId);
        if (!accessScope.success) {
            return { success: false };
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking assessment access:", error);
        return { success: false, message: 'Internal server error', status: 500 };
    }
};

export default checkAssessmentAccess;