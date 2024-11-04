import { User } from "../../models/index.js";

export const checkUserAccess = async (user, resourceId, actionIdDb) => {
    try {
        const userDb = await User.findByPk(resourceId);
        if (user.roleId === 'superadmin') return true;
        if (user.roleId === 'admin') {
            if (user.companyId == userDb.companyId) return true;
        }
        else {
            if (user.departmentId === userDb.departmentId) return true;
        }
        return false;
    } catch (error) {
        console.error("Error checking Role access:", error);
        return false;
    }
};