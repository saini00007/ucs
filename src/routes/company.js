import express from 'express';
import {
    createCompany,
    getAllCompanies,
    getCompanyById,
    deleteCompany,
    updateCompany,
    getDepartmentsByCompanyId,
    getUsersByCompanyId,
    getReportByCompanyId,
    getCompanyLogo,
    getDepartmentStatusReportAccordingToCompliance,
    getDepartmentStatusReportAccordingToTime,
    getDepartmentsDashboard,
    getAssessmentsCategoryWise,
    getRiskMetricsForCompany,
    getCompanyOverview,
    createCompanyDetails,
    addCompanyControlFrameworks,
    getDepartmentsWithSubDepartmentsByCompanyId,
    updateCompanyDetails,
    updateCompanyControlFrameworks,
    getCompanySetupStatus
} from '../controllers/company.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createCompanySchema, updateCompanySchema } from '../joi/company.js';
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';

import uploadMiddleware from '../middleware/fileUpload.js';
const uploadCompanyLogo = uploadMiddleware.companyLogo(5, 1)

const router = express.Router();





router.get('/:companyId/setup-status', getCompanySetupStatus);
router.post('/:companyId/details',uploadCompanyLogo,createCompanyDetails)
router.put('/:companyId/details',uploadCompanyLogo,updateCompanyDetails)
router.post('/:companyId/control-frameworks',addCompanyControlFrameworks)
router.put('/:companyId/control-frameworks',updateCompanyControlFrameworks)
router.get('/:companyId/department-subdepartment-list',getDepartmentsWithSubDepartmentsByCompanyId)











// Route to create a new company
router.post('/',
    attachResourceInfo(
        RESOURCE_TYPES.COMPANY,
        null,
        null,
        ACTION_IDS.CREATE
    ),
    checkAccess,
    validate(createCompanySchema),
    createCompany
);

// Route to update a company by its ID
router.put('/:companyId',
    attachResourceInfo(
        RESOURCE_TYPES.COMPANY,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.UPDATE
    ),
    checkAccess,
    uploadCompanyLogo,
    validate(updateCompanySchema),
    updateCompany
);

// Route to get all companies
router.get('/',
    attachResourceInfo(
        RESOURCE_TYPES.COMPANY,
        null,
        null,
        ACTION_IDS.LIST
    ),
    checkAccess,
    getAllCompanies
);

// Route to get a company by its ID
router.get('/:companyId',
    attachResourceInfo(
        RESOURCE_TYPES.COMPANY,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getCompanyById
);

// Route to delete a company by its ID
router.delete('/:companyId',
    attachResourceInfo(
        RESOURCE_TYPES.COMPANY,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.REMOVE
    ),
    checkAccess,
    deleteCompany
);

// Route to get all departments for a company
router.get('/:companyId/departments',
    attachResourceInfo(
        RESOURCE_TYPES.DEPARTMENT,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getDepartmentsByCompanyId
);

// Route to get users of a company
router.get('/:companyId/users',
    attachResourceInfo(
        RESOURCE_TYPES.USER,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.LIST
    ),
    checkAccess,
    getUsersByCompanyId
);

// Route to get report
router.get('/:companyId/report',
    attachResourceInfo(
        RESOURCE_TYPES.REPORT,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getReportByCompanyId
);

router.get('/:companyId/logo',
    attachResourceInfo(
        RESOURCE_TYPES.COMPANY,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.READ
    ),
    checkAccess,
    getCompanyLogo
);

router.get('/:companyId/progress-report/time',
    attachResourceInfo(RESOURCE_TYPES.COMPANY_PROGRESS_REPORT,
        CONTENT_RESOURCE_TYPES.COMPANY,
        'companyId',
        ACTION_IDS.READ),
    checkAccess,
    getDepartmentStatusReportAccordingToTime
)
router.get('/:companyId/progress-report/compliance',
    // attachResourceInfo(RESOURCE_TYPES.COMPANY_PROGRESS_REPORT,
    //     CONTENT_RESOURCE_TYPES.COMPANY,
    //     'companyId',
    //     ACTION_IDS.READ),
    // checkAccess,
    getDepartmentStatusReportAccordingToCompliance
    // getDepartmentsDashboard
)

router.get('/:companyId/assessments/categorized',
    // getAssessmentsCategoryWise
    getAssessmentsCategoryWise
)

router.get('/:companyId/risk-metrics',
    getRiskMetricsForCompany
)

router.get('/:companyId/overview',
    getCompanyOverview
)

export default router;