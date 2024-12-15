export const checkAccessScope = (user, companyId, departmentId) => {

    if (user.roleId === 'superadmin') return { success: true };
    if (user.roleId === 'admin') return { success: user.companyId === companyId };
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
