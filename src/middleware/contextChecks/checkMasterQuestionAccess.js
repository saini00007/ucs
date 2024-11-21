const checkMasterQuestionAccess = async (user, resourceId) => {
    try {
        return user.roleId === 'superadmin';
    } catch (error) {
        console.error("Error checking MasterQuestion access:", error);
        return false;
    }
};

export default checkMasterQuestionAccess;
