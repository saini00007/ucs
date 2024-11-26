const checkRoleAccess = (user) => {
    try {
        const hasAccess = ['superadmin', 'admin', 'departmentmanager'].includes(user.roleId);
        if (!hasAccess) {
            console.log(`Access denied: User with role ${user.roleId} does not have the required access.`);
        }
        return hasAccess;
    } catch (error) {
        console.error("Error checking role access:", error);
        return false;
    }
};

export default checkRoleAccess;
