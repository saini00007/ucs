import { Assessment, AssessmentQuestion, MasterQuestion, MasterSubDepartment, SubAssessment, SubDepartment } from "../models";
import AppError from "./AppError";

export const createDepartmentAssessment = async ({
    departmentId,
    masterDepartmentId,
    deadline,
    transaction
}) => {
    // Create a new assessment for the department
    const newAssessment = await Assessment.create({
        departmentId,
        deadline
    }, { transaction });

    // Find questions linked to the master department
    const questions = await MasterQuestion.findAll({
        where: { masterDepartmentId },
        attributes: ['id', 'masterSubDepartmentId'],
        transaction,
    });

    // Get unique master sub-department IDs from questions
    const uniqueMasterSubDeptIds = [...new Set(
        questions
            .filter(q => q.masterSubDepartmentId)
            .map(q => q.masterSubDepartmentId)
    )];

    // Create sub-departments and their assessments
    const subDepartments = await Promise.all(uniqueMasterSubDeptIds.map(async (masterSubDeptId) => {
        // Get master sub-department details
        const masterSubDept = await MasterSubDepartment.findByPk(masterSubDeptId, {
            attributes: ['subDepartmentName'],
            transaction
        });

        // Create sub-department
        const subDepartment = await SubDepartment.create({
            subDepartmentName: masterSubDept.subDepartmentName,
            departmentId,
            masterSubDepartmentId: masterSubDeptId
        }, { transaction });
        console.log(deadline)
        // Create sub-assessment
        const subAssessment = await SubAssessment.create({
            subAssessmentName: `${newAssessment.assessmentName}_${subDepartment.subDepartmentName}`,
            subDepartmentId: subDepartment.id,
            assessmentId: newAssessment.id,
            deadline
        }, { transaction });

        // Create assessment questions for this sub-department
        const subDeptQuestions = questions.filter(q => q.masterSubDepartmentId === masterSubDeptId);
        await Promise.all(subDeptQuestions.map(async (question) => {
            await AssessmentQuestion.create({
                assessmentId: newAssessment.id,
                masterQuestionId: question.id,
                subAssessmentId: subAssessment.id
            }, { transaction });
        }));

        return subDepartment;
    }));

    return {
        assessment: newAssessment,
        subDepartments
    };
};

export const validateAssessmentDeadline = async (companyAuditCompletionDeadline, assessmentDeadline) => {
    if (companyAuditCompletionDeadline) {
        if (assessmentDeadline > companyAuditCompletionDeadline) {
            throw new AppError('Deadline must be less than audit completion deadline of company', 400);
        }
    }
    else {
        const maxAllowedDeadline = new Date(new Date().setMonth(new Date().getMonth() + 2));
        if (assessmentDeadline > maxAllowedDeadline) {
            throw new AppError('Deadline must be less than max allowed deadline', 400);
        }
    }
}