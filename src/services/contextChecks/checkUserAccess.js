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
            return false;
        }

        // Superadmin has universal access
        if (user.roleId === 'superadmin') {
            return true;
        }

        // Admin - check company access
        if (user.roleId === 'admin') {
            return user.companyId === userDb.companyId;
        }
        // Department manager 
        if (user.roleId === 'departmentmanager') {
            return user.departments.some(department =>
                userDb.departments.some(dbDept => dbDept.id === department.id)
            );
        }

        // Regular user - can only access own data
        return user.id === userDb.id;

    } catch (error) {
        console.error("Error checking user access:", error);
        return false;
    }
};

export default checkUserAccess;