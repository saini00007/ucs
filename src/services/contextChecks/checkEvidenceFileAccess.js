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
                                    include: [
                                        {
                                            model: Department,
                                            as: 'department',
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
            return false;
        }

        const assessment = evidenceFile.answer.assessmentQuestion.assessment;
        const departmentId = assessment.departmentId;
        const companyId = assessment.department.companyId;

        return checkAccessScope(user, companyId, departmentId) &&
            checkAssessmentState(assessment);

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        return false;
    }
};

export default checkEvidenceFileAccess;