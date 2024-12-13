import { User, Department } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

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
            return createResponse(false, "Access denied: User not found.", 404);
        }

        if (user.roleId === 'superadmin') {
            return createResponse(true, "Access granted", 200);
        }

        if (user.roleId === 'admin' && user.companyId === userDb.companyId) {
            return createResponse(true, "Access granted - Company admin", 200);
        }

        if (user.roleId === 'departmentmanager') {
            const hasAccess = user.departments.some(department =>
                userDb.departments.some(dbDept => dbDept.id === department.id)
            );

            if (!hasAccess) {
                return createResponse(false, "Access denied: Department manager does not belong to the same department.", 403);
            }

            return createResponse(true, "Access granted - Department manager", 200);
        }

        const hasAccess = user.id === userDb.id;
        if (!hasAccess) {
            return createResponse(false, "Access denied: User is not the same as the resource user.", 403);
        }

        return createResponse(true, "Access granted - Self access", 200);

    } catch (error) {
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkUserAccess;
