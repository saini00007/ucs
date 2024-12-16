import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
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
                            include: [
                                {
                                    model: Assessment,
                                    as: 'assessment',
                                    attributes: ['assessmentStarted', 'submitted', 'departmentId'],
                                    include: [
                                        {
                                            model: Department,
                                            as: 'department',
                                            attributes: ['id', 'companyId'],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });

        if (!evidenceFile) {
            // If the evidence file is not found, throw an error
            throw new AppError('EvidenceFile not found', 404);
        }

        const assessment = evidenceFile.answer.assessmentQuestion.assessment;
        const departmentId = assessment.departmentId;
        const companyId = assessment.department.companyId;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId);
        if (!accessScope.success) {
            // If access scope is denied, throw an error
            throw new AppError('Access denied: insufficient access scope', 403);
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(assessment);
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
