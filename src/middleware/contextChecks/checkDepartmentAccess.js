import { Department } from "../../models/index.js";
const checkDepartmentAccess = async (user, resourceId) => {
    try {
        const department = await Department.findByPk(resourceId);

        if (!department) return false;

        const companyId = department.companyId;
        const departmentId = department.id;

        if (user.roleId === 'admin') {
            return companyId === user.companyId;
        }

        const userDepartments = user.departments.map(department => department.id);
        return userDepartments.includes(departmentId);
    } catch (error) {
        console.error("Error checking department access:", error);
        return false;
    }
};

export default checkDepartmentAccess;
