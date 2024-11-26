import { AssessmentQuestion, Department, Assessment } from "../../models/index.js";

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
            console.log("Access denied: Assessment question not found.");
            return false;
        }

        const { assessmentStarted, submitted, departmentId } = assessmentQuestion.assessment;
        if (!assessmentStarted) {
            console.log("Access denied: Assessment has not started.");
            return false;
        }

        if (submitted) {
            console.log("Access denied: Assessment has already been submitted.");
            return false;
        }

        const companyId = assessmentQuestion.assessment.department.companyId;

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return true;
        }

        const hasAccess = user.departments.some(department => department.id === departmentId);
        if (!hasAccess) {
            console.log("Access denied: User does not belong to the department.");
        }

        return hasAccess;
    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return false;
    }
};

export default checkAssessmentQuestionAccess;
