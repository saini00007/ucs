import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department, SubAssessment, SubDepartment } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";
import AppError from "../../utils/AppError.js";

const checkEvidenceFileAccess = async (user, resourceId) => {
    try {
        const evidenceFile = await EvidenceFile.findByPk(resourceId, {
            include: [
                {
                    model: Answer,
                    as: 'answer',
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
                },
            ],
        });

        if (!evidenceFile) {
            // If the evidence file is not found, throw an error
            throw new AppError('EvidenceFile not found', 404);
        }

        const subDepartment = evidenceFile.answer.assessmentQuestion.subAssessment.subDepartment;
        const companyId = subDepartment.department.companyId;
        const departmentId = subDepartment.department.id;
        const subDepartmentId = subDepartment.id;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId,subDepartmentId);
        if (!accessScope.success) {
            // If access scope is denied, throw an error
            throw new AppError('Access denied: insufficient access scope', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(evidenceFile.answer.assessmentQuestion.subAssessment.assessment);
        if (!assessmentState.success) {
            // If assessment state is not valid, throw an error
            throw new AppError(assessmentState.message || 'Invalid assessment state', assessmentState.status || 400);
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        throw error;
    }
};

export default checkEvidenceFileAccess;
