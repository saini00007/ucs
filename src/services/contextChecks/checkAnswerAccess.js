import { Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";
import createResponse from '../../utils/contextCheckResponse.js';

const checkAnswerAccess = async (user, resourceId) => {
    try {
        const answer = await Answer.findByPk(resourceId, {
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
        });

        if (!answer) {
            return createResponse(false, "Access denied: Answer not found.", 404);
        }

        const assessment = answer.assessmentQuestion?.assessment;
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

        const departmentId = assessment.departmentId;
        const companyId = assessment.department?.companyId;

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return createResponse(true, "Access granted", 200);
        }

        const userDepartments = user.departments.map(department => department.id);
        if (!userDepartments.includes(departmentId)) {
            return createResponse(false, "Access denied: User does not belong to the department.", 403);
        }

        return createResponse(true, "Access granted", 200);

    } catch (error) {
        console.error("Error checking answer access:", error);
        return createResponse(false, "Internal server error while checking access.", 500);
    }
};

export default checkAnswerAccess;
