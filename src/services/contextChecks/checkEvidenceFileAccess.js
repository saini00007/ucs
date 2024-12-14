import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
import { checkAccessScope, checkAssessmentState } from "../../utils/accessValidators.js";

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
            return {
                success: false,
                message: 'EvidenceFile not found',
                status: 404,
            };
        }

        const assessment = evidenceFile.answer.assessmentQuestion.assessment;
        const departmentId = assessment.departmentId;
        const companyId = assessment.department.companyId;

        // Check access scope
        const accessScope = checkAccessScope(user, companyId, departmentId);
        if (!accessScope.success) {
            return { success: false };
        }

        // Check assessment state
        const assessmentState = checkAssessmentState(assessment);
        if (!assessmentState.success) {
            return {
                success: false,
                message: assessmentState.message,
                status: assessmentState.status,
            };
        }

        return { success: true };

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        return {
            success: false,
            message: 'Internal server error',
            status: 500,
        };
    }
};

export default checkEvidenceFileAccess;
