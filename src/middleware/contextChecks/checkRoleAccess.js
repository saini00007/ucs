const checkRoleAccess = (user) => {
    try {
        return ['superadmin', 'admin'].includes(user.roleId);
    } catch (error) {
        console.error("Error checking Role access:", error);
        return false;
    }
};

export default checkRoleAccess;
