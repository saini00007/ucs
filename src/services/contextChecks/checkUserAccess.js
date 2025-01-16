import { User, Department } from "../../models/index.js";
import AppError from "../../utils/AppError.js";
import { ROLE_IDS } from "../../utils/constants.js";

const checkUserAccess = async (user, resourceId) => {
    try {
        const userDb = await User.findByPk(resourceId, {
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: { attributes: [] },
            }],
        });

        if (!userDb) {
            // If the user is not found, throw an error
            throw new AppError('User not found', 404);
        }

        // Superadmin has universal access
        if (user.roleId === ROLE_IDS.SUPER_ADMIN) {
            return { success: true };
        }

        if (user.roleId === ROLE_IDS.ADMIN||user.roleId===ROLE_IDS.LEADERSHIP) {
            // Admin can access only if they belong to the same company
            if (user.companyId !== userDb.companyId) {
                throw new AppError('Access denied: user does not belong to the same company', 403);
            }
            return { success: true };
        }

        if (user.roleId === ROLE_IDS.DEPARTMENT_MANAGER) {
            // Check if the user has access to any of the same departments
            const hasDepartmentAccess = user.departments.some(department =>
                userDb.departments.some(dbDept => dbDept.id === department.id)
            );
            if (!hasDepartmentAccess) {
                throw new AppError('Access denied: no department access', 403);
            }
            return { success: true };
        }

        // Regular user - can only access their own data
        if (user.id === userDb.id) {
            return { success: true };
        }

        // If none of the above conditions matched, deny access
        throw new AppError('Access denied: insufficient permissions', 403);

    } catch (error) {
        console.error("Error checking user access:", error);
        throw error;
    }
};

export default checkUserAccess;
