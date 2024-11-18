import { Comment, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

// This function checks if a user has access to a specific comment based on their role, department, and the type of action.
const checkCommentAccess = async (user, resourceId, action) => {
    try {
        // Retrieve the comment by its ID, along with associated assessment question, assessment, and department details.
        const comment = await Comment.findByPk(resourceId, {
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

        // If no comment is found, or if the assessment is not started or already submitted, deny access.
        if (!comment || !comment.assessmentQuestion.assessment.assessmentStarted || comment.assessmentQuestion.assessment.submitted) {
            return false; // Access denied.
        }

        // Extract the department and company IDs from the associated assessment.
        const departmentId = comment.assessmentQuestion.assessment.departmentId;
        const companyId = comment.assessmentQuestion.assessment.department.companyId;

        // If the action is 'delete' or 'update' and the comment belongs to the user, grant access.
        if ((action === 'delete' || action === 'update') && comment.userId === user.id) {
            return true; // User can modify their own comment.
        }

        // Admin users can access comments if they're part of the same company.
        if (user.roleId === 'admin' && user.companyId === companyId) {
            return true; // Admin can access comments from their own company.
        }

        // Non-admin users can access comments if they belong to the same department as the assessment.
        return user.departmentId === departmentId; // Access granted if department IDs match.
    } catch (error) {
        console.error("Error checking Comment access:", error);
        return false; // Return false if an error occurs.
    }
};

export default checkCommentAccess;
