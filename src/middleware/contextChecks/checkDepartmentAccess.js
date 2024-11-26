import { Department } from "../../models/index.js";

const checkDepartmentAccess = async (user, resourceId) => {
    try {
        const department = await Department.findByPk(resourceId);

        if (!department) {
            console.log("Access denied: Department not found.");
            return false;
        }

        const companyId = department.companyId;
        const departmentId = department.id;
     console.log(user);
        if (user.roleId === 'admin') {
            const hasAccess = companyId === user.companyId;
            if (!hasAccess) {
                console.log("Access denied: Admin does not belong to the company.");
            }
            return hasAccess;
        }
        
        const userDepartments = user.departments.map(department => department.id);
        console.log(userDepartments);
        console.log(department.id);
        const hasAccess = userDepartments.includes(departmentId);
        if (!hasAccess) {
            console.log("Access denied: User does not belong to the department.");
        }

        return hasAccess;
    } catch (error) {
        console.error("Error checking department access:", error);
        return false;
    }
};

export default checkDepartmentAccess;
