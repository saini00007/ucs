import { User, Department } from "../../models/index.js";

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
            return {
                success: false,
                message: 'User not found',
                status: 404,
            };
        }

        // Superadmin has universal access
        if (user.roleId === 'superadmin') {
            return { success: true };
        }

        if (user.roleId === 'admin') {
            return { success: user.companyId === userDb.companyId };
        }

        if (user.roleId === 'departmentmanager') {
            const hasDepartmentAccess = user.departments.some(department =>
                userDb.departments.some(dbDept => dbDept.id === department.id)
            );
            return { success: hasDepartmentAccess };
        }

        // Regular user - can only access their own data
        if (user.id === userDb.id) {
            return { success: true };
        }

        return { success: false };

    } catch (error) {
        console.error("Error checking user access:", error);
        return {
            success: false,
            message: 'Internal server error',
            status: 500,
        };
    }
};

export default checkUserAccess;
