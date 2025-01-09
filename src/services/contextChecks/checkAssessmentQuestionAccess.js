import { AssessmentQuestion, Department, Assessment, SubAssessment, SubDepartment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkAssessmentQuestionAccess = async (user, resourceId) => {
    try {

        const assessmentQuestion = await AssessmentQuestion.findByPk(resourceId, {
            include: {
                model: SubAssessment,
                as: 'subAssessment',
                attributes: ['subAssessmentStarted', 'submitted', 'subDepartmentId'],
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
            }
        });

        if (!assessmentQuestion) {
            throw new AppError('Assessment question not found', 404);
        }
        const subDepartment = assessmentQuestion.subAssessment.subDepartment;
        const companyId = subDepartment.department.companyId;
        const departmentId = subDepartment.department.id;
        const subDepartmentId = subDepartment.id;


        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId, subDepartmentId);
        if (!accessScope.success) {
            throw new AppError('Access denied: insufficient permissions', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(assessmentQuestion.subAssessment.assessment);
        if (!assessmentState.success) {
            throw new AppError(assessmentState.message || 'Assessment state is not valid', assessmentState.status || 400);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking assessment question access:", error);
        throw error;
    }
};

export default checkAssessmentQuestionAccess;
