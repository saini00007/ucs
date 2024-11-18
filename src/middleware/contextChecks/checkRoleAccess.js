// Function to check if a user has access based on their role (superadmin or admin)
const checkRoleAccess = async (user, resourceId) => {
    try {
        // If the user's role is 'superadmin' or 'admin', grant access (return true)
        if (user.roleId === 'superadmin' || user.roleId === 'admin') {
            return true; // Superadmins and admins have access to all resources.
        }

        // If the user's role is not 'superadmin' or 'admin', deny access (return false)
        return false; // Other roles are not allowed to access this resource.

    } catch (error) {
        console.error("Error checking Role access:", error);
        return false; // Return false in case of an error while checking access.
    }
};

export default checkRoleAccess;
