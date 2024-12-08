import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

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
            console.log("Access denied: Evidence file not found.");
            return false;
        }

        const departmentId = evidenceFile.answer.assessmentQuestion.assessment.departmentId;
        const companyId = evidenceFile.answer.assessmentQuestion.assessment.department.companyId;

        if (user.roleId === 'admin') {
            const hasAccess = user.companyId === companyId;
            if (!hasAccess) {
                console.log("Access denied: Admin does not belong to the company.");
            }
            return hasAccess;
        }

        const userDepartments = user.departments.map(department => department.id);
        const hasAccess = userDepartments.includes(departmentId);
        if (!hasAccess) {
            console.log("Access denied: User does not belong to the department.");
        }

        return hasAccess;
    } catch (error) {
        console.error("Error checking evidence file access:", error);
        return false;
    }
};

export default checkEvidenceFileAccess;
