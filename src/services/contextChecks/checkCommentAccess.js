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
            return false;
        }

        const assessment = comment.assessmentQuestion.assessment;
        const companyId = assessment.department.companyId;
        const departmentId = assessment.departmentId;

        // Check basic access first
        if (!checkAccessScope(user, companyId, departmentId) ||
            !checkAssessmentState(assessment)) {
            return false;
        }

        // Check owner permissions for update/delete
        if ((actionId === 'remove' || actionId === 'update') &&
            user.roleId !== 'superadmin' &&
            comment.createdByUserId !== user.id) {
            return false;
        }

        return true;

    } catch (error) {
        console.error("Error checking comment access:", error);
        return false;
    }
};

export default checkCommentAccess;