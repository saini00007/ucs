import { Assessment, AssessmentQuestion, Company, MasterDepartment, MasterQuestion, MasterSubDepartment, SubAssessment, SubDepartment } from "../models";
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

export const validateDepartmentMappings = async (mappings, companyId) => {
    // Validate company
    const company = await Company.findByPk(companyId);
    if (!company) throw new AppError('Company not found', 404);
  
    // Get master data
    const masterDepartments = await MasterDepartment.findAll({
      include: [{
        model: MasterSubDepartment,
        as: 'masterSubDepartments'
      }]
    });
  
    // Check department count match
    const masterDeptIds = masterDepartments.map(d => d.id);
    const requestedDeptIds = mappings.map(m => m.masterDepartmentId);
  
    if (requestedDeptIds.length !== masterDeptIds.length) {
      throw new AppError('All master departments must be mapped', 400);
    }
  
    // Check for duplicate departments
    if (new Set(requestedDeptIds).size !== requestedDeptIds.length) {
      throw new AppError('Duplicate department mappings found', 400);
    }
  
    // Validate each department and its subdepartments
    for (const dept of mappings) {
      // Validate department exists
      const masterDept = masterDepartments.find(md => md.id === dept.masterDepartmentId);
      if (!masterDept) {
        throw new AppError(`Invalid master department ID: ${dept.masterDepartmentId}`, 400);
      }
  
      const masterSubDepts = masterDept.masterSubDepartments;
      const requestedSubDepts = dept.subdepartments;
  
      // Check subdepartment count match
      if (requestedSubDepts.length !== masterSubDepts.length) {
        throw new AppError(`All subdepartments must be mapped for department: ${dept.mappedName}`, 400);
      }
  
      // Check for duplicate subdepartments
      const subDeptIds = requestedSubDepts.map(s => s.masterSubDepartmentId);
      if (new Set(subDeptIds).size !== subDeptIds.length) {
        throw new AppError(`Duplicate subdepartment mappings found in department: ${dept.mappedName}`, 400);
      }
  
      // Validate each subdepartment exists and belongs to department
      requestedSubDepts.forEach(sub => {
        if (!masterSubDepts.some(msd => msd.id === sub.masterSubDepartmentId)) {
          throw new AppError(`Invalid master subdepartment ID: ${sub.masterSubDepartmentId}`, 400);
        }
      });
  
      // Validate deadline
      if (!dept.closureDate) {
        throw new AppError(`Deadline required for department: ${dept.mappedName}`, 400);
      }
  
      if (company.auditCompletionDeadline && new Date(dept.closureDate) > new Date(company.auditCompletionDeadline)) {
        throw new AppError(`Department deadline cannot exceed company audit completion deadline`, 400);
      }
    }
  
    return { company, masterDepartments };
  };