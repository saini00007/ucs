import { Assessment, Department } from "../../models/index.js";
import { checkAccessScope } from "../../utils/accessValidators.js";

const checkAssessmentAccess = async (user, resourceId) => {
    try {
        const assessment = await Assessment.findByPk(resourceId, {
            include: {
                model: Department,
                as: 'department',
            }
        });

        if (!assessment) {
            return false;
        }
        const { companyId, id: departmentId } = assessment.department;


        return checkAccessScope(user, companyId, departmentId);

    } catch (error) {
        console.error("Error checking assessment access:", error);
        return false;
    }
};

export default checkAssessmentAccess;