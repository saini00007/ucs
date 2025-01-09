import { Comment, AssessmentQuestion, Assessment, Department, SubAssessment, SubDepartment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";
import { ROLE_IDS } from "../../utils/constants.js";

const checkCommentAccess = async (user, resourceId, actionId) => {
    try {
        const comment = await Comment.findByPk(resourceId, {
            include: [
                {
                    model: AssessmentQuestion,
                    as: 'assessmentQuestion',
                    include: {
                        model: SubAssessment,
                        as: 'subAssessment',
                        attributes: ['subAssessmentStarted', 'submitted', 'subDepartmentId'],
                        include: [{
                            model: SubDepartment,
                            as: 'subDepartment',
                            attributes: ['id'],
                            include: [{
                                mode: Department,
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
                },
            ],
        });

        if (!comment) {
            // If the comment is not found, return an error
            throw new AppError('Comment not found', 404);
        }

        const subDepartment = comment.assessmentQuestion.subAssessment.subDepartment;
        const companyId = subDepartment.department.companyId;
        const departmentId = subDepartment.department.id;
        const subDepartmentId = subDepartment.id;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId, subDepartmentId);
        if (!accessScope.success) {
            // If the user does not have access to the department or company, return an error
            throw new AppError('Access denied: insufficient permissions', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(comment.assessmentQuestion.subAssessment.assessment);
        if (!assessmentState.success) {
            // If the assessment state is not valid, return an error
            throw new AppError(assessmentState.message || 'Assessment state is not valid', assessmentState.status || 400);
        }

        // Check owner permissions for update/delete
        if ((actionId === 'remove' || actionId === 'update') &&
            user.roleId !== ROLE_IDS.SUPER_ADMIN &&
            comment.createdByUserId !== user.id) {
            // If the user is not a superadmin and does not own the comment, deny access
            throw new AppError('You do not have permission to modify this comment', 403);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking comment access:", error);
        throw error;
    }
};

export default checkCommentAccess;
