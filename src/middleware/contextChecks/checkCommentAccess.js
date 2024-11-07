import { Comment, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
export const checkCommentAccess = async (user, resourceId, actionIdDb) => {
    try {
        const comment = await Comment.findByPk(resourceId, {
            include: [
                {
                    model: AssessmentQuestion,
                    include: [
                        {
                            model: Assessment,
                            include: [
                                {
                                    model: Department,
                                },
                            ],
                        },
                    ],
                },
            ],
        },

        );

        if (!comment) {
            console.log(`Comment with ID ${resourceId} not found`);
            return false;
        }

        const departmentId = comment.AssessmentQuestion.Assessment.departmentId;
        const companyId = comment.AssessmentQuestion.Assessment.Department.companyId;

        if (action === 'delete' || action === 'update') {
            return comment.userId === user.id;
        }

        if (user.roleId === 'admin') {
            if (user.companyId === companyId) {
                return true;
            }
        }

        if (user.departmentId === departmentId) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error checking Comment access:", error);
        return false;
    }
};
