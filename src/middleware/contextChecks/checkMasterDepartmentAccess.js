const checkMasterDepartmentAccess = async (user, resourceId) => {
    try {
        return user.roleId === 'superadmin';
    } catch (error) {
        console.error("Error checking MasterDepartment access:", error);
        return false;
    }
};

export default checkMasterDepartmentAccess;
