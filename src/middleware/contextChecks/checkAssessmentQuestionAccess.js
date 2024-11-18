import { AssessmentQuestion, Department, Assessment } from "../../models/index.js";

// This function checks if a user has access to a specific assessment question based on their role, department, and company.
const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {
        // Find the assessment question by its ID, including the associated assessment and department details.
        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
            include: [
                {
                    model: Assessment,
                    attributes: ['assessmentStarted', 'submitted', 'departmentId'], // Include relevant attributes for the assessment.
                    include: [
                        {
                            model: Department,
                            as: 'department',
                            attributes: ['id', 'companyId'], // Include department ID and company ID for access validation.
                        },
                    ],
                },
            ],
        });

        // If no assessment question is found or if the assessment is not started or already submitted, deny access.
        if (!assessmentQuestion || !assessmentQuestion.assessment.assessmentStarted || assessmentQuestion.assessment.submitted) {
            return false; // Access denied.
        }

        // Get the department and company IDs associated with the assessment question.
        const departmentId = assessmentQuestion.assessment.departmentId;
        const companyId = assessmentQuestion.assessment.department.companyId;

        // Check access based on the user's role.
        if (user.roleId === 'admin') {
            // Admins can access the assessment question if it's part of the same company.
            return user.companyId === companyId; // Access granted if company IDs match.
        } else {
            // Non-admin users can access the question if they belong to the same department.
            return user.departmentId === departmentId; // Access granted if department IDs match.
        }
    } catch (error) {
        console.error("Error checking assessment question access:", error);
        return false; // Return false if an error occurs.
    }
};

export default checkAssessmentQuestionAccess;
