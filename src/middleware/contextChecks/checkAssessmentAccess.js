import { Assessment,Department } from "../../models/index.js";

const checkAssessmentAccess = async (user, resourceId) => {
    try {
        const assessment = await Assessment.findByPk(resourceId, {
            include: {
                model: Department,
                as: 'department',
            }
        });

        if (!assessment) return false;

        const { companyId, id: departmentId } = assessment.department;

        if (user.roleId === 'admin' && user.companyId === companyId) return true;

        return user.departments.some(department => department.id === departmentId);
    } catch (error) {
        console.error("Error checking assessment access:", error);
        return false;
    }
};

export default checkAssessmentAccess;
