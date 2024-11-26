import { User, Department } from "../../models/index.js";

const checkUserAccess = async (user, resourceId) => {
    try {
        const userDb = await User.findByPk(resourceId, {
            include: [{
                model: Department,
                as: 'departments',
                attributes: ['id'],
                through: { attributes: [] }
            }]
        });

        if (!userDb) {
            console.error("Access denied: User not found.");
            return false;
        }

        if (user.roleId === 'admin' && user.companyId === userDb.companyId) {
            return true;
        }

        if (user.roleId === 'departmentmanager') {
            const hasAccess = user.departments.some(department =>
                userDb.departments.some(dbDept => dbDept.id === department.id)
            );
            if (!hasAccess) {
                console.log("Access denied: Department manager does not belong to the same department.");
            }
            return hasAccess;
        }

        const hasAccess = user.id === userDb.id;
        if (!hasAccess) {
            console.log("Access denied: User is not the same as the resource user.");
        }
        return hasAccess;
    } catch (error) {
        console.error("Error checking user access:", error);
        return false;
    }
};

export default checkUserAccess;
