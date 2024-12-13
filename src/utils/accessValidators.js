export const checkAccessScope = (user, companyId, departmentId) => {
    if (user.roleId === 'superadmin') return true;
    if (user.roleId === 'admin' && user.companyId === companyId) return true;
    return user.departments.some(department => department.id === departmentId);
};

export const checkAssessmentState = (assessment) => {
    return assessment.assessmentStarted && !assessment.submitted;
};