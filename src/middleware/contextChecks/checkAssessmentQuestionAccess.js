import { AssessmentQuestion,Department } from "../../models/index.js";

const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {
        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
            include: {
                model: Assessment,
                attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                include: {
                    model: Department,
                    as: 'department',
                    attributes: ['companyId'],
                },
            }
        });

        if (!assessmentQuestion || !assessmentQuestion.assessment.assessmentStarted || assessmentQuestion.assessment.submitted) {
            return false;
        }

        const { departmentId } = assessmentQuestion.assessment;
        const companyId = assessmentQuestion.assessment.department.companyId;

        if (user.roleId === 'admin' && user.companyId === companyId) return true;

        return user.departments.some(department => department.id === departmentId);
    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return false;
    }
};

export default checkAssessmentQuestionAccess;
