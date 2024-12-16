import { Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkAnswerAccess = async (user, resourceId) => {
    try {
        const answer = await Answer.findByPk(resourceId, {
            include: [
                {
                    model: AssessmentQuestion,
                    as: 'assessmentQuestion',
                    include: [
                        {
                            model: Assessment,
                            as: 'assessment',
                            attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                            include: [
                                {
                                    model: Department,
                                    as: 'department',
                                    attributes: ['id', 'companyId'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!answer) {
            throw new AppError('Answer not Found', 404);
        }

        const assessment = answer.assessmentQuestion.assessment;
        const departmentId = assessment.departmentId;
        const companyId = assessment.department.companyId;

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
        console.error("Error checking answer access:", error);
        throw error;
    }
};

export default checkAnswerAccess;
