import { Comment, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

const checkCommentAccess = async (user, resourceId, action) => {
    try {
        const comment = await Comment.findByPk(resourceId, {
            include: [
                {
                    model: AssessmentQuestion,
                    as:'assessmentQuestion',
                    include: [
                        {
                            model: Assessment,
                            as:'assessment',
                            attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                            include: [
                                {
                                    model: Department,
                                    as:'department',
                                    attributes: ['id', 'companyId'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!comment || !comment.assessmentQuestion.assessment.assessmentStarted || comment.assessmentQuestion.assessment.submitted) {
            return false;
        }

        const departmentId = comment.assessmentQuestion.assessment.departmentId;
        const companyId = comment.assessmentQuestion.assessment.department.companyId;

        if ((action === 'delete' || action === 'update') && comment.userId === user.id) {
            return true;
        }

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return true;
        }

        return user.departmentId === departmentId;
    } catch (error) {
        console.error("Error checking Comment access:", error);
        return false;
    }
};
export default checkCommentAccess;