import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

// This function checks if a user has access to a specific evidence file based on their role and department/company association.
const checkEvidenceFileAccess = async (user, resourceId) => {
    try {
        // Retrieve the evidence file by its ID and include related Answer, AssessmentQuestion, Assessment, and Department models.
        const evidenceFile = await EvidenceFile.findByPk(resourceId, {
            include: [
                {
                    model: Answer,
                    as: 'answer',
                    include: [
                        {
                            model: AssessmentQuestion,
                            as: 'assessmentQuestion',
                            include: [
                                {
                                    model: Assessment,
                                    as: 'assessment',
                                    include: [
                                        {
                                            model: Department,
                                            as: 'department',
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        // If the evidence file is not found, log the error and deny access.
        if (!evidenceFile) {
            console.log(`Evidence file with ID ${resourceId} not found`);
            return false; // Evidence file does not exist, access denied.
        }

        // Get the department ID and company ID from the assessment associated with the evidence file.
        const departmentId = evidenceFile.answer.assessmentQuestion.assessment.departmentId;
        const companyId = evidenceFile.answer.assessmentQuestion.assessment.department.companyId;

        // If the user is an admin, check if the user's company ID matches the company ID of the department.
        if (user.roleId === 'admin') {
            if (user.companyId === companyId) {
                return true; // Admin has access if the company ID matches.
            }
        } else {
            // If the user is not an admin, check if the user's department ID matches the department ID associated with the evidence file.
            if (user.departmentId === departmentId) {
                return true; // User has access if the department ID matches.
            }
        }

        // If neither condition is met, deny access.
        return false;

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        return false; // Return false if an error occurs.
    }
};

export default checkEvidenceFileAccess;
