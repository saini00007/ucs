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
            console.error("User not found");
            return false;
        }

        if (user.roleId === 'admin' && user.companyId === userDb.companyId) return true;

        if (user.roleId === 'departmentManager') {
            return user.departments.some(department =>
                userDb.departments.some(dbDept => dbDept.id === department.id)
            );
        }

        return user.id === userDb.id;
    } catch (error) {
        console.error("Error checking user access:", error);
        return false;
    }
};

export default checkUserAccess;
