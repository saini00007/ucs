import { Company } from "../../models/index.js";

// This function checks if a user has access to a specific company based on their associated company ID.
const checkCompanyAccess = async (user, resourceId) => {
    try {
        // Retrieve the company by its ID from the database.
        const company = await Company.findByPk(resourceId);

        // If no company is found with the provided ID, deny access.
        if (!company) {
            console.log(`Company with ID ${resourceId} not found`);
            return false; // Company does not exist, return false.
        }
        // Check if the user's company ID matches the company ID in the database.
        if (company.id === user.companyId) {
            return true; // User is part of the company, access granted.
        }

        return false; // User does not belong to the company, access denied.

    } catch (error) {
        console.error("Error checking company access:", error);
        return false; // Return false if an error occurs.
    }
};

export default checkCompanyAccess;
