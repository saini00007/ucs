import { Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

// Function to check if a user has access to a specific answer
const checkAnswerAccess = async (user, resourceId) => {
    try {
        // Retrieve the answer by its primary key (resourceId), including necessary associations
        const answer = await Answer.findByPk(resourceId, {
            include: [
                {
                    model: AssessmentQuestion,
                    as: 'assessmentQuestion',
                    include: [
                        {
                            model: Assessment,
                            as: 'assessment',
                            attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                            include: [
                                {
                                    model: Department,
                                    as: 'department',
                                    attributes: ['id', 'companyId'],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        // If answer does not exist or the assessment hasn't started/submitted, deny access
        if (!answer || !answer?.assessmentQuestion?.assessment?.assessmentStarted || answer?.assessmentQuestion?.assessment?.submitted) {
            return false;
        }        

        // Extract department and company IDs from the associated assessment data
        const departmentId = answer.assessmentQuestion.assessment.departmentId;
        const companyId = answer.assessmentQuestion.assessment.department.companyId;

        // If the user is an admin, check if the user's company matches the company's ID in the department
        if (user.roleId === 'admin') {
            return user.companyId === companyId;
        }

        // For other roles, ensure the user belongs to the same department as the assessment
        return user.departmentId === departmentId; // User can only access answers from their own department
    } catch (error) {
        console.error("Error checking answer access:", error);
        return false; // In case of an error, deny access
    }
};

export default checkAnswerAccess;
