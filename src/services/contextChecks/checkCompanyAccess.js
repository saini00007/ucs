import { Company } from "../../models/index.js";
import AppError from "../../utils/AppError.js";

const checkCompanyAccess = async (user, resourceId) => {
    try {
        const company = await Company.findByPk(resourceId);

        if (!company) {
            // If the company is not found, throw an error
            throw new AppError('Company not found', 404);
        }

        if (user.roleId === 'superadmin' || user.companyId === resourceId) {
            return { success: true };
        } else {
            // If the user does not have permission, throw an error
            throw new AppError('Access denied: insufficient permissions', 403);
        }

    } catch (error) {
        throw error;
    }
};

export default checkCompanyAccess;
