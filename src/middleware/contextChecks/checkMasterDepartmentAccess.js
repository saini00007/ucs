export const checkMasterDepartmentAccess = async (user, resourceId) => {
    try {
        if (user.roleId === 'superadmin') { return true };
        return false;
    } catch (error) {
        console.error("Error checking MasterDepartment access:", error);
        return false;
    }
};