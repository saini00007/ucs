import { Assessment, Department } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

const checkAssessmentAccess = async (user, resourceId) => {
    try {
        const assessment = await Assessment.findByPk(resourceId, {
            include: {
                model: Department,
                as: 'department',
            }
        });

        if (!assessment) {
            return createResponse(false, "Access denied: Assessment not found.", 404);
        }

        if (user.roleId === 'superadmin') {
            return createResponse(true, "Access granted", 200);
        }

        const { companyId, id: departmentId } = assessment.department;

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return createResponse(true, "Access granted", 200);
        }

        const hasAccess = user.departments.some(department => department.id === departmentId);

        if (!hasAccess) {
            return createResponse(false, "Access denied: User does not belong to the department.", 403);
        }

        return createResponse(true, "Access granted", 200);

    } catch (error) {
        console.error("Error checking assessment access:", error);
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkAssessmentAccess;
