import { Assessment, Department } from "../../models/index.js";

 const checkAssessmentAccess = async (user, resourceId) => {
    try {

        const assessment = await Assessment.findByPk(resourceId, {
            include: [
                {
                    model: Department,
                    as:'department'
                }
            ]
        });
        if (!assessment) {
            console.log(`Assessment with ID ${resourceId} not found`);
            return false;
        }
        if (user.roleId === 'admin') {
            if (assessment.department && assessment.department.companyId === user.companyId) {
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
export default checkAssessmentAccess;
