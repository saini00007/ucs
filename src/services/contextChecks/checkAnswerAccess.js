import { Answer, AssessmentQuestion, Assessment, Department } from "../../models/index.js";

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
            console.log("Access denied: Answer not found.");
            return false;
        }

        const assessment = answer.assessmentQuestion?.assessment;
        if (!assessment) {
            console.log("Access denied: Assessment not found.");
            return false;
        }

        if (!assessment.assessmentStarted) {
            console.log("Access denied: Assessment has not started.");
            return false;
        }

        if (assessment.submitted) {
            console.log("Access denied: Assessment has already been submitted.");
            return false;
        }

        const departmentId = assessment.departmentId;
        const companyId = assessment.department?.companyId;

        if (user.roleId === 'admin' && user.companyId === companyId) {
            return true;
        }

        const userDepartments = user.departments.map(department => department.id);
        if (!userDepartments.includes(departmentId)) {
            console.log("Access denied: User does not belong to the department.");
            return false;
        }

        return true;
    } catch (error) {
        console.error("Error checking access to the answer:", error);
        return false;
    }
};

export default checkAnswerAccess;
