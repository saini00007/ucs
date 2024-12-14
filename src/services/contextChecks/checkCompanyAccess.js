import { Company } from "../../models/index.js";

const checkCompanyAccess = async (user, resourceId) => {
    try {
        const company = await Company.findByPk(resourceId);

        if (!company) {
            return {
                success: false,
                message: 'Company not found',
                status: 404
            };
        }

        if (user.roleId === 'superadmin' || user.companyId === resourceId) {
            return { success: true };
        } else {
            return { success: false };
        }

    } catch (error) {
        console.error("Error checking company access:", error);
        return {
            success: false,
            message: 'Internal server error',
            status: 500
        };
    }
};

export default checkCompanyAccess;
