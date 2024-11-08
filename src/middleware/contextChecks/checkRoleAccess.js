const checkRoleAccess = async (user, resourceId) => {
    try {
        if (user.roleId === 'superadmin' || user.roleId === 'admin') { return true };
        return false;
    } catch (error) {
        console.error("Error checking Role access:", error);
        return false;
    }
};
export default checkRoleAccess;