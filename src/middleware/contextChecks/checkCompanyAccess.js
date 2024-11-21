import { Company } from "../../models/index.js";

const checkCompanyAccess = async (user, resourceId) => {
    try {
        const company = await Company.findByPk(resourceId);

        if (!company) return false;

        return company.id === user.companyId;
    } catch (error) {
        console.error("Error checking company access:", error);
        return false;
    }
};

export default checkCompanyAccess;

