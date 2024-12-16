import { AssessmentQuestion, Department, Assessment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js"; 

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
            throw new AppError('Assessment question not found', 404);
        }

        const assessment = assessmentQuestion.assessment;
        const companyId = assessment.department.companyId;
        const departmentId = assessment.departmentId;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId);
        if (!accessScope.success) {
            throw new AppError('Access denied: insufficient permissions', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(assessment);
        if (!assessmentState.success) {
            throw new AppError(assessmentState.message || 'Assessment state is not valid', assessmentState.status || 400);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking assessment question access:", error);
        throw error;
    }
};

export default checkAssessmentQuestionAccess;
