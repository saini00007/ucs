//have to change CONTENT_RESOURCE_TYPES keys , and CONTENT_RESOURCE_TYPES keys to camelcase

// For answer values
export const ANSWER_TYPES = {
    YES: 'yes',
    NO: 'no',
    NOT_APPLICABLE: 'notApplicable'
};

// For role IDs
export const ROLE_IDS = {
    ADMIN: 'admin',
    ASSESSOR: 'assessor',
    DEPARTMENT_MANAGER: 'departmentmanager',
    REVIEWER: 'reviewer',
    SUPER_ADMIN: 'superadmin',
    LEADERSHIP: 'leadership'
};

export const ANSWER_REVIEW_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    IMPROVED: 'improved'
};

export const ANSWER_TYPE = {
    DEFAULT: 'default',
    IMPROVED: 'improved'
}

export const SUB_ASSESSMENT_REVIEW_STATUS = {
    DRAFT: 'draft',           // Initial state
    SUBMITTED_FOR_REVIEW: 'submittedForReview',  // Submitted to reviewer
    UNDER_REVIEW: 'underReview',    // Reviewer is working on it
    NEED_REVISION: 'needRevision',  // Some answers rejected, back to assessor
    COMPLETED: 'completed'          // All approved
};

// For action IDs
export const ACTION_IDS = {
    READ: 'read',
    CREATE: 'create',
    UPDATE: 'update',
    REMOVE: 'remove',
    LIST: 'list',
    START: 'start',
    SUBMIT: 'submit',
    REOPEN: 'reopen'
};

export const RESOURCE_TYPES = {
    COMPANY: 'Company',
    DEPARTMENT: 'Department',
    SUB_DEPARTMENT: 'SubDepartment',
    ASSESSMENT: 'Assessment',
    SUB_ASSESSMENT: 'SubAssessment',
    ASSESSMENT_QUESTION: 'AssessmentQuestion',
    SUB_ASSESSMENT_QUESTION: 'SubAssessmentQuestion',
    ANSWER: 'Answer',
    USER: 'User',
    EVIDENCE_FILE: 'EvidenceFile',
    COMMENT: 'Comment',
    MASTER_QUESTION: 'MasterQuestion',
    MASTER_DEPARTMENT: 'MasterDepartment',
    ROLE: 'Role',
    USER_DEPARTMENT_LINK: 'UserDepartmentLink',
    USER_SUB_DEPARTMENT_LINK: 'UserSubDepartmentLink',
    REPORT: 'Report',
    COMPANY_PROGRESS_REPORT: 'CompanyProgressReport',
    CONTROL_FRAMEWORK: 'ControlFramework',
    INDUSTRY_SECTOR: 'IndustrySector'
};

export const CONTENT_RESOURCE_TYPES = {
    COMPANY: 'Company',
    DEPARTMENT: 'Department',
    SUB_DEPARTMENT: 'SubDepartment',
    ASSESSMENT: 'Assessment',
    SUB_ASSESSMENT: 'SubAssessment',
    ASSESSMENT_QUESTION: 'AssessmentQuestion',
    ANSWER: 'Answer',
    USER: 'User',
    EVIDENCE_FILE: 'EvidenceFile',
    COMMENT: 'Comment',
    MASTER_QUESTION: 'MasterQuestion',
    MASTER_DEPARTMENT: 'MasterDepartment',
    ROLE: 'Role',
    USER_DEPARTMENT_LINK: 'UserDepartmentLink',
    REPORT: 'Report',
    INDUSTRY_SECTOR: 'IndustrySector'
};

export const resourceTypeToId = {
    [RESOURCE_TYPES.COMPANY]: 'company',
    [RESOURCE_TYPES.DEPARTMENT]: 'department',
    [RESOURCE_TYPES.SUB_DEPARTMENT]: 'subdepartment',
    [RESOURCE_TYPES.ASSESSMENT]: 'assessment',
    [RESOURCE_TYPES.SUB_ASSESSMENT]: 'subassessment',
    [RESOURCE_TYPES.ASSESSMENT_QUESTION]: 'assessmentquestion',
    [RESOURCE_TYPES.SUB_ASSESSMENT_QUESTION]: 'subassessmentquestion',
    [RESOURCE_TYPES.ANSWER]: 'answer',
    [RESOURCE_TYPES.USER]: 'user',
    [RESOURCE_TYPES.EVIDENCE_FILE]: 'evidencefile',
    [RESOURCE_TYPES.COMMENT]: 'comment',
    [RESOURCE_TYPES.MASTER_QUESTION]: 'masterquestion',
    [RESOURCE_TYPES.MASTER_DEPARTMENT]: 'masterdepartment',
    [RESOURCE_TYPES.ROLE]: 'role',
    [RESOURCE_TYPES.USER_DEPARTMENT_LINK]: 'userdepartmentlink',
    [RESOURCE_TYPES.USER_SUB_DEPARTMENT_LINK]: 'usersubdepartmentlink',
    [RESOURCE_TYPES.REPORT]: 'report',
    [RESOURCE_TYPES.INDUSTRY_SECTOR]: 'industrysector',
    [RESOURCE_TYPES.COMPANY_PROGRESS_REPORT]: 'companyprogressreport',
    [RESOURCE_TYPES.CONTROL_FRAMEWORK]: 'controlframework'
};

export const frameworkFieldMapping = {
    'PCIDSS': 'pcidss',
    'IEC62443': 'iec62443ControlId',
    'NIST80082': 'nist80082ControlId',
    'MITREDEFEND': 'mitreDefendControlId',
    'NISTCSF': 'nistCsfControlId',
    'ISO27001': 'iso270012022CIdNum'
};

export const ASSESSMENT_TYPE = {
    DEFAULT: 'default',
    CUSTOM: 'custom'
}

export const SUB_ASSESSMENT_TYPE = {
    DEFAULT: 'default',
    CUSTOM: 'custom'
}