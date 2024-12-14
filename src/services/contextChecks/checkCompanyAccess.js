import { Company } from "../../models/index.js";

const checkCompanyAccess = async (user, resourceId) => {
    try {

        const company = await Company.findByPk(resourceId);

        if (!company) {
            return false;
        }

        return user.roleId === 'superadmin' || user.companyId === resourceId;

    } catch (error) {
        console.error("Error checking company access:", error);
        return false;
    }
};

export default checkCompanyAccess;