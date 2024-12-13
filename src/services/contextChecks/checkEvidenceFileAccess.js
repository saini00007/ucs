import { EvidenceFile, Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

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
            return createResponse(false, "Access denied: Evidence file not found.", 404);
        }

        const assessment = evidenceFile.answer?.assessmentQuestion?.assessment;
        if (!assessment) {
            return createResponse(false, "Access denied: Assessment not found.", 404);
        }

        if (!assessment.assessmentStarted) {
            return createResponse(false, "Access denied: Assessment has not started.", 422);
        }

        if (assessment.submitted) {
            return createResponse(false, "Access denied: Assessment has already been submitted.", 422);
        }

        if (user.roleId === 'superadmin') {
            return createResponse(true, "Access granted", 200);
        }

        const departmentId = evidenceFile.answer.assessmentQuestion.assessment.departmentId;
        const companyId = evidenceFile.answer.assessmentQuestion.assessment.department.companyId;

        if (user.roleId === 'admin') {
            const hasAccess = user.companyId === companyId;
            if (!hasAccess) {
                return createResponse(false, "Access denied: Admin does not belong to the company.", 403);
            }
            return createResponse(true, "Access granted", 200);
        }

        const userDepartments = user.departments.map(department => department.id);
        const hasAccess = userDepartments.includes(departmentId);

        if (!hasAccess) {
            console.log("Access denied: User does not belong to the department.");
            return createResponse(false, "Access denied: User does not belong to the department.", 403);
        }

        return createResponse(true, "Access granted", 200);

    } catch (error) {
        console.error("Error checking evidence file access:", error);
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkEvidenceFileAccess;
