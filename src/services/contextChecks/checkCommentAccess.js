import { Comment, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";

const checkCommentAccess = async (user, resourceId, actionId) => {
    try {
        const comment = await Comment.findByPk(resourceId, {
            include: {
                model: AssessmentQuestion,
                as: 'assessmentQuestion',
                include: {
                    model: Assessment,
                    as: 'assessment',
                    attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                    include: {
                        model: Department,
                        as: 'department',
                        attributes: ['companyId'],
                    },
                },
            },
        });

        if (!comment) {
            return {
                success: false,
                message: 'Comment not found',
                status: 404
            };
        }

        const assessment = comment.assessmentQuestion.assessment;
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

        // Check owner permissions for update/delete
        if ((actionId === 'remove' || actionId === 'update') &&
            user.roleId !== 'superadmin' &&
            comment.createdByUserId !== user.id) {
            return {
                success: false
            };
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking comment access:", error);
        return { success: false, message: 'Internal server error', status: 500 };
    }
};

export default checkCommentAccess;
