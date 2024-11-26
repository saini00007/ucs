import { Comment, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

const checkCommentAccess = async (user, resourceId, actionId) => {
    try {
        const comment = await Comment.findByPk(resourceId, {
            include: {
                model: AssessmentQuestion,
                as: 'assessmentQuestion',
                include: {
                    model: Assessment,
                    attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                    include: {
                        model: Department,
                        as: 'department',
                        attributes: ['companyId'],
                    },
                },
            },
        });

        if (!comment || !comment.assessmentQuestion.assessment.assessmentStarted || comment.assessmentQuestion.assessment.submitted) {
            return false;
        }

        const { departmentId } = comment.assessmentQuestion.assessment;
        const companyId = comment.assessmentQuestion.assessment.department.companyId;

        if ((actionId === 'delete' || actionId === 'update') && comment.userId === user.id) return true;

        if (user.roleId === 'admin' && user.companyId === companyId) return true;

        return user.departments.some(department => department.id === departmentId);
    } catch (error) {
        console.error("Error checking comment access:", error);
        return false;
    }
};

export default checkCommentAccess;
