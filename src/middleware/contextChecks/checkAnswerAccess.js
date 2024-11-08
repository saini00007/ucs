import { Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

 const checkAnswerAccess = async (user, resourceId) => {
    try {
        const answer = await Answer.findByPk(resourceId, {
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

        if (!answer || !answer.assessmentQuestion.assessment.assessmentStarted || answer.assessmentQuestion.assessment.submitted) {
            return false;
        }

        const departmentId = answer.assessmentQuestion.assessment.departmentId;
        const companyId = answer.assessmentQuestion.assessment.department.companyId;

        if (user.roleId === 'admin') {
            return user.companyId === companyId;
        }

        return user.departmentId === departmentId;
    } catch (error) {
        console.error("Error checking answer access:", error);
        return false;
    }
};
export default checkAnswerAccess;