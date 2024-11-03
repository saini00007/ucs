import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

export const checkEvidenceFileAccess = async (user, resourceId) => {
    try {
        const evidenceFile = await EvidenceFile.findByPk(resourceId, {
            include: [
                {
                    model: Answer,
                    include: [
                        {
                            model: AssessmentQuestion,
                            include: [
                                {
                                    model: Assessment,
                                    include: [
                                        {
                                            model: Department,
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

        const departmentId = evidenceFile.Answer.AssessmentQuestion.Assessment.departmentId;
        const companyId = evidenceFile.Answer.AssessmentQuestion.Assessment.Department.companyId;
        if (user.roleId === 'superadmin') {
            return true;
        } else if (user.roleId === 'admin') {
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
