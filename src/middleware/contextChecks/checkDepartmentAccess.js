import { Department } from "../../models/index.js";

 const checkDepartmentAccess = async (user, resourceId) => {
    try {
        const department = await Department.findByPk(resourceId);

        if (!department) {
            console.log(`Department with ID ${resourceId} not found`);
            return false;
        }
        if (user.roleId === 'admin') {
            if (department.companyId === user.companyId) {
                return true;
            }
        } else {
            if (department.id === user.departmentId) {
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error("Error checking department access:", error);
        return false;
    }
};
export default checkDepartmentAccess;