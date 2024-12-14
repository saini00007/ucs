import { AssessmentQuestion, Department, Assessment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";

const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {
        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
            include: {
                model: Assessment,
                as: 'assessment',
                attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                include: {
                    model: Department,
                    as: 'department',
                    attributes: ['companyId'],
                },
            }
        });

        if (!assessmentQuestion) {
            return false;
        }

        const assessment = assessmentQuestion.assessment;
        const companyId = assessment.department.companyId;
        const departmentId = assessment.departmentId;

        return checkAccessScope(user, companyId, departmentId) &&
            checkAssessmentState(assessment);

    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return false;
    }
};

export default checkAssessmentQuestionAccess;