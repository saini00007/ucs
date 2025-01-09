import { Assessment, Department, SubAssessment, SubDepartment } from "../../models";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators";
import AppError from "../../utils/AppError";

const checkSubAssessmentAccess = async (user, resourceId) => {
    try {
        const subAssessment = await SubAssessment.findByPk(resourceId, {
            include: [{
                model: SubDepartment,
                as: 'subDepartment',
                attributes: ['id'],
                include: [{
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'companyId']
                }]
            },
            {
                model: Assessment,
                as: 'assessment',
                attributes: ['assessmentStarted', 'submitted', 'departmentId']
            }]
        });

        if (!subAssessment) {
            throw new AppError('SubAssessment not found', 404);
        }

        const subDepartment = subAssessment.subDepartment;
        const companyId = subDepartment.department.companyId;
        const departmentId = subDepartment.department.id;
        const subDepartmentId = subDepartment.id;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId, subDepartmentId);
        if (!accessScope.success) {
            throw new AppError('Access denied: insufficient permissions', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(subAssessment.assessment);
        if (!assessmentState.success) {
            throw new AppError(assessmentState.message || 'Assessment state is not valid', assessmentState.status || 400);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking subassessment access:", error);
        throw error;
    }
};
export default checkSubAssessmentAccess
