// Function to check if a user has access to a MasterDepartment resource based on their role.
const checkMasterDepartmentAccess = async (user, resourceId) => {
    try {
        // If the user is a 'superadmin', they have access to all resources, so return true.
        if (user.roleId === 'superadmin') {
            return true; // Superadmins have unrestricted access.
        }

        // If the user is not a superadmin, deny access.
        return false; // Only superadmins have access, other roles are denied.

    } catch (error) {
        console.error("Error checking MasterDepartment access:", error);
        return false; // Return false if an error occurs.
    }
};

export default checkMasterDepartmentAccess;
