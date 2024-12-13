import { Company } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

const checkCompanyAccess = async (user, resourceId) => {
    try {
        const company = await Company.findByPk(resourceId);

        if (!company) {
            return createResponse(false, "Access denied: Company not found.", 404);
        }

        if (user.roleId === 'superadmin') {
            return createResponse(true, "Access granted", 200);
        }

        const hasAccess = company.id === user.companyId;

        if (!hasAccess) {
            return createResponse(false, "Access denied: User does not belong to the company.", 403);
        }

        return createResponse(true, "Access granted", 200);

    } catch (error) {
        console.error("Error checking company access:", error);
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkCompanyAccess;
