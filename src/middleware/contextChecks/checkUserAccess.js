// Function to check if a user has access to a resource based on their role and department/company
const checkUserAccess = async (user, resourceId, actionIdDb) => {
    try {
        // Retrieve the user from the database using the provided resourceId (the user being checked)
        const userDb = await User.findByPk(resourceId);
        
        // If the user is an admin, they can access resources within their company
        if (user.roleId === 'admin') {
            // Admins have access to users within the same company
            if (user.companyId == userDb.companyId) {
                return true; // Grant access if the company IDs match
            }
        } else {
            // For non-admins, check if the department IDs match
            if (user.departmentId === userDb.departmentId) {
                return true; // Grant access if the department IDs match
            }
        }

        return false;

    } catch (error) {
        console.error("Error checking Role access:", error);
        return false; // Return false in case of an error (access denied)
    }
};

export default checkUserAccess;
