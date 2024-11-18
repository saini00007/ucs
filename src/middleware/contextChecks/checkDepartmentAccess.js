import { Department } from "../../models/index.js";

// This function checks if a user has access to a specific department based on their role and associated department/company IDs.
const checkDepartmentAccess = async (user, resourceId) => {
    try {
        // Retrieve the department by its ID from the database.
        const department = await Department.findByPk(resourceId);

        // If no department is found with the provided ID, deny access.
        if (!department) {
            console.log(`Department with ID ${resourceId} not found`);
            return false; // Department does not exist, access denied.
        }

        // If the user is an admin, check if the department belongs to the same company as the user.
        if (user.roleId === 'admin') {
            if (department.companyId === user.companyId) {
                return true; // Admin has access if the company ID matches.
            }
        } else {
            // If the user is not an admin, check if the user's department ID matches the department's ID.
            if (department.id === user.departmentId) {
                return true; // User has access if the department ID matches.
            }
        }

        // If neither condition is met, deny access.
        return false;

    } catch (error) {
        console.error("Error checking department access:", error);
        return false; // Return false if an error occurs.
    }
};

export default checkDepartmentAccess;
