import { ROLE_IDS } from "./constants";

export const checkAccessScopeForDepartment = (user, companyId, departmentId) => {
    if (user.roleId === ROLE_IDS.SUPER_ADMIN) return { success: true };
    if (user.roleId === ROLE_IDS.ADMIN) return { success: user.companyId === companyId };
    return { success: user.departments.some(department => department.id === departmentId) };
};
export const checkAccessScope = (user, companyId, departmentId, subDepartmentId) => {
    if (user.roleId === ROLE_IDS.SUPER_ADMIN) return { success: true };
    if (user.roleId === ROLE_IDS.ADMIN) return { success: user.companyId === companyId };
    if (user.roleId === ROLE_IDS.DEPARTMENT_MANAGER) return { success: user.departments.some(department => department.id === departmentId) };
    return {
        success: user.subDepartments.some(subdept => subdept.id === subDepartmentId)
    };
};

export const checkAssessmentState = (assessment) => {
    if (!assessment.assessmentStarted) {
        return { success: false, message: 'Assessment has not started yet', status: 403 };
    }
    if (assessment.submitted) {
        return { success: false, message: 'Assessment has already been submitted', status: 403 };
    }
    return { success: true };
};

 export const checkSubAssessmentState = (subAssessment) => {
     if (!subAssessment.subAssessmentStarted) {
         return { success: false, message: 'Sub assessment has not started yet', status: 403 };
     }
     if (subAssessment.submitted) {
         return { success: false, message: 'Sub assessment has already been submitted', status: 403 };
     }
     return { success: true };
 };