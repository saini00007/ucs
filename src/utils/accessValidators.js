import { ROLE_IDS } from "./constants";

export const checkAccessScope = (user, companyId, departmentId) => {
    if (user.roleId === ROLE_IDS.SUPER_ADMIN) return { success: true };
    if (user.roleId === ROLE_IDS.ADMIN) return { success: user.companyId === companyId };
    return { success: user.departments.some(department => department.id === departmentId) };
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