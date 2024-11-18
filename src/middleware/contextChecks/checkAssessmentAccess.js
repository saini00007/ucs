import { Assessment, Department } from "../../models/index.js";

//function to checks if a user has access to a specific assessment based on their role and department/company association.
const checkAssessmentAccess = async (user, resourceId) => {
    try {
        // Find the assessment by its ID and include the associated department details.
        const assessment = await Assessment.findByPk(resourceId, {
            include: [
                {
                    model: Department,
                    as: 'department' // Include department details associated with the assessment.
                }
            ]
        });

        // If no assessment is found, access is denied.
        if (!assessment) {
            console.log(`Assessment with ID ${resourceId} not found`);
            return false;
        }

        // If the user is an admin, check if the assessment belongs to their company.
        if (user.roleId === 'admin') {
            // Admins are allowed access if the assessment is from the same company.
            if (assessment.department && assessment.department.companyId === user.companyId) {
                return true; // Access granted to admins from the same company.
            }
        } else {
            // For non-admin users, check if they belong to the same department as the assessment.
            if (assessment.departmentId === user.departmentId) {
                return true; // Access granted to users from the same department.
            }
        }

        // If neither condition is met, access is denied.
        return false;

    } catch (error) {
        console.error("Error checking assessment access:", error);
        return false;
    }
};

export default checkAssessmentAccess;
