const checkMasterQuestionAccess = async (user, resourceId) => {
    try {
        if (user.roleId === 'superadmin') { return true };
        return false;
    } catch (error) {
        console.error("Error checking MasterQuestion access:", error);
        return false;
    }
};
export default checkMasterQuestionAccess;