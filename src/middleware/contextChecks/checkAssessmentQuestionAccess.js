import { AssessmentQuestion } from "../../models/index.js";
import Department from "../../models/Department.js";
import Assessment from "../../models/Assessment.js";

export const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {
        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
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
        });
        console.log(assessmentQuestion);

        if (!assessmentQuestion) {
            return false;
        }

        const departmentId = assessmentQuestion.Assessment.Department.id;
        const companyId = assessmentQuestion.Assessment.Department.companyId;

        if (user.roleId === 'admin') {
            return user.companyId === companyId;
        } else {
            return user.departmentId === departmentId;
        }
    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return false;
    }
};
