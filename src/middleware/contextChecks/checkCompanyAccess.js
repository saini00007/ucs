import { Company } from "../../models/index.js";

 const checkCompanyAccess = async (user, resourceId) => {
    try {
        const company = await Company.findByPk(resourceId);
        if (!company) {
            console.log(`Company with ID ${resourceId} not found`);
            return false;
        }
            if (company.id === user.companyId) {
                return true;
            }

        return false;

    } catch (error) {
        console.error("Error checking company access:", error);
        return false;
    }
};
export default checkCompanyAccess;