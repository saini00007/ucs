import { Company } from "../../models/index.js";

const checkCompanyAccess = async (user, resourceId) => {
    try {
        const company = await Company.findByPk(resourceId);

        if (!company) {
            console.log("Access denied: Company not found.");
            return false;
        }

        const hasAccess = company.id === user.companyId;
        if (!hasAccess) {
            console.log("Access denied: User does not belong to the company.");
        }

        return hasAccess;
    } catch (error) {
        console.error("Error checking company access:", error);
        return false;
    }
};

export default checkCompanyAccess;
