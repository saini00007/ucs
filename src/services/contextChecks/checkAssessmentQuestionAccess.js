import { AssessmentQuestion, Department, Assessment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";

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
            return {
                success: false,
                message: 'Assessment question not found',
                status: 404
            };
        }

        const assessment = assessmentQuestion.assessment;
        const companyId = assessment.department.companyId;
        const departmentId = assessment.departmentId;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId);
        if (!accessScope.success) {
            return { success: false };
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(assessment);
        if (!assessmentState.success) {
            return { success: false, message: assessmentState.message, status: assessmentState.status };
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return { success: false, message: 'Internal server error', status: 500 };
    }
};

export default checkAssessmentQuestionAccess;
