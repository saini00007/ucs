import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

const checkEvidenceFileAccess = async (user, resourceId) => {
    try {
        const evidenceFile = await EvidenceFile.findByPk(resourceId, {
            include: [
                {
                    model: Answer,
                    as:'answer',
                    include: [
                        {
                            model: AssessmentQuestion,
                            as:'assessmentQuestion',
                            include: [
                                {
                                    model: Assessment,
                                    as:'assessment',
                                    include: [
                                        {
                                            model: Department,
                                            as:'department'
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
            console.log(`Evidence file with ID ${resourceId} not found`);
            return false;
        }

        const departmentId = evidenceFile.answer.assessmentQuestion.assessment.departmentId;
        const companyId = evidenceFile.answer.assessmentQuestion.assessment.department.companyId;
        if (user.roleId === 'admin') {
            if (user.companyId === companyId) {
                return true;
            }
        } else {
            if (user.departmentId === departmentId) {
                return true;
            }
        }

        return false;

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        return false;
    }
};
export default checkEvidenceFileAccess;