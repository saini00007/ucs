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
    getCompanyLogo
} from '../controllers/company.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createCompanySchema, updateCompanySchema } from '../joi/company.js';

import uploadMiddleware from '../middleware/fileUpload.js';
const uploadCompanyLogo = uploadMiddleware.companyLogo(5, 1)

const router = express.Router();

// Route to create a new company
router.post('/',
    attachResourceInfo('Company', null, null, 'create'),
    checkAccess,
    uploadCompanyLogo,
    validate(createCompanySchema),
    createCompany
);

// Route to update a company by its ID
router.put('/:companyId',
    attachResourceInfo('Company', 'Company', 'companyId', 'update'),
    checkAccess,
    uploadCompanyLogo,
    validate(updateCompanySchema),
    updateCompany
);

// Route to get all companies
router.get('/',
    attachResourceInfo('Company', null, null, 'list'),
    checkAccess,
    getAllCompanies
);

// Route to get a company by its ID
router.get('/:companyId',
    attachResourceInfo('Company', 'Company', 'companyId', 'read'),
    checkAccess,
    getCompanyById
);

// Route to delete a company by its ID
router.delete('/:companyId',
    attachResourceInfo('Company', 'Company', 'companyId', 'remove'),
    checkAccess,
    deleteCompany
);

// Route to get all departments for a company
router.get('/:companyId/departments',
    attachResourceInfo('Department', 'Company', 'companyId', 'list'),
    checkAccess,
    getDepartmentsByCompanyId
);

// Route to get users of a company
router.get('/:companyId/users',
    attachResourceInfo('User', 'Company', 'companyId', 'list'),
    checkAccess,
    getUsersByCompanyId
);

//Route to get report
router.get('/:companyId/report',
    attachResourceInfo('Report', 'Company', 'companyId', 'read'),
    checkAccess,
    getReportByCompanyId
)

router.get('/:companyId/logo',
    // attachResourceInfo('Company', 'Company', 'companyId', 'read'),
    // checkAccess,
    getCompanyLogo
)

export default router;
