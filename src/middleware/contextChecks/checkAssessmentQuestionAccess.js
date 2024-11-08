import { AssessmentQuestion,Department,Assessment } from "../../models/index.js";
const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {
        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
            include: [
                {
                    model: Assessment,
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
        });

        if (!assessmentQuestion || !assessmentQuestion.assessment.assessmentStarted || assessmentQuestion.assessment.submitted) {
            return false;
        }

        const departmentId = assessmentQuestion.assessment.departmentId;
        const companyId = assessmentQuestion.assessment.department.companyId;

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
export default checkAssessmentQuestionAccess;