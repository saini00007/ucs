import { AssessmentQuestion, Department, Assessment } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {
        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
            include: {
                model: Assessment,
                as: 'assessment',
                attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                include: {
                    model: Department,
                    as: 'department',
                    attributes: ['companyId'],
                },
            }
        });

        if (!assessmentQuestion) {
            return createResponse(false, "Access denied: Assessment question not found.", 404);
        }

        const { assessmentStarted, submitted, departmentId } = assessmentQuestion.assessment;

        if (!assessmentStarted) {
            return createResponse(false, "Access denied: Assessment has not started.", 422);
        }

        if (submitted) {
            return createResponse(false, "Access denied: Assessment has already been submitted.", 422);
        }

        if (user.roleId === 'superadmin') {
            return createResponse(true, "Access granted", 200);
        }

        const companyId = assessmentQuestion.assessment.department.companyId;

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return createResponse(true, "Access granted", 200);
        }

        const hasAccess = user.departments.some(department => department.id === departmentId);

        if (!hasAccess) {
            return createResponse(false, "Access denied: User does not belong to the department.", 403);
        }

        return createResponse(true, "Access granted", 200);

    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkAssessmentQuestionAccess;
