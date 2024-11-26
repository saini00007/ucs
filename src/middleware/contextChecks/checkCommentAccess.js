import { Comment, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

const checkCommentAccess = async (user, resourceId, actionId) => {
    try {
        const comment = await Comment.findByPk(resourceId, {
            include: {
                model: AssessmentQuestion,
                as: 'assessmentQuestion',
                include: {
                    model: Assessment,
                    as:'assessment',
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
            console.log("Access denied: Comment not found.");
            return false;
        }

        const { assessmentStarted, submitted, departmentId } = comment.assessmentQuestion.assessment;

        if (!assessmentStarted) {
            console.log("Access denied: Assessment has not started.");
            return false;
        }

        if (submitted) {
            console.log("Access denied: Assessment has already been submitted.");
            return false;
        }

        const companyId = comment.assessmentQuestion.assessment.department.companyId;

        if ((actionId === 'delete' || actionId === 'update') && comment.userId === user.id) {
            return true;
        }

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return true;
        }

        const hasAccess = user.departments.some(department => department.id === departmentId);
        if (!hasAccess) {
            console.log("Access denied: User does not belong to the department.");
        }

        return hasAccess;
    } catch (error) {
        console.error("Error checking comment access:", error);
        return false;
    }
};

export default checkCommentAccess;
