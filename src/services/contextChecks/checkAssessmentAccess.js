import { Assessment, Department } from "../../models/index.js";

const checkAssessmentAccess = async (user, resourceId) => {
    try {
        const assessment = await Assessment.findByPk(resourceId, {
            include: {
                model: Department,
                as: 'department',
            }
        });

        if (!assessment) {
            console.log("Access denied: Assessment not found.");
            return false;
        }

        const { companyId, id: departmentId } = assessment.department;

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return true;
        }

        const hasAccess = user.departments.some(department => department.id === departmentId);
        if (!hasAccess) {
            console.log("Access denied: User does not belong to the department.");
        }

        return hasAccess;
    } catch (error) {
        console.error("Error checking assessment access:", error);
        return false;
    }
};

export default checkAssessmentAccess;
