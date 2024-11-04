import { Assessment, Department } from "../../models/index.js";

export const checkAssessmentAccess = async (user, resourceId) => {
    try {
        if(user.roleId==='superadmin')return true;
        
        const assessment = await Assessment.findByPk(resourceId, {
            include: [
                {
                    model: Department,
                }
            ]
        });
        console.log(assessment);
        if (!assessment) {
            console.log(`Assessment with ID ${resourceId} not found`);
            return false;
        }

        if (user.roleId === 'superadmin') {
            return true;
        } else if (user.roleId === 'admin') {
            if (assessment.Department && assessment.Department.companyId === user.companyId) {
                return true;
            }
        } else {
            if (assessment.departmentId === user.departmentId) {
                return true;
            }
        }
        return false;

    } catch (error) {
        console.error("Error checking assessment access:", error);
        return false;
    }
};
