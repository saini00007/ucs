import { Answer, Department, Assessment,AssessmentQuestion } from "../../models/index.js";

export const checkAnswerAccess = async (user, resourceId) => {
    try {
        const answer = await Answer.findByPk(resourceId, {
            include: [
                {
                    model: AssessmentQuestion,
                    include: [
                        {
                            model: Assessment,
                            include: [
                                {
                                    model: Department,
                                    attributes: ['id', 'companyId'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (
            !answer
        ) {
            return false;
        }

        const departmentId = answer.AssessmentQuestion.Assessment.departmentId;
        const companyId = answer.AssessmentQuestion.Assessment.Department.companyId;

        if (user.roleId === 'superadmin') {
            return true;
        } else if (user.roleId === 'admin') {
            return user.companyId === companyId;
        } else if (user.departmentId === departmentId) {
            return true;
        }

        return false;

    } catch (error) {
        console.error("Error checking answer access:", error);
        return false;
    }
};