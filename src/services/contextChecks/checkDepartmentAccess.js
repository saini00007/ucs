import { Department } from "../../models/index.js";
import { checkAccessScope } from "../../utils/accessValidators.js";

const checkDepartmentAccess = async (user, resourceId) => {
   try {
       const department = await Department.findByPk(resourceId);

       if (!department) {
           return false;
       }

       return checkAccessScope(user, department.companyId, department.id);

   } catch (error) {
       console.error("Error checking department access:", error);
       return false;
   }
};

export default checkDepartmentAccess;