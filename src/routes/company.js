import express from 'express';
import {
    createCompany,
    getAllCompanies,
    getCompanyById,
    deleteCompany,
    updateCompany
} from '../controllers/company.js';

import attachResourceInfo from '../utils/attachResourceInfo.js';
import { checkAccess } from '../middleware/authorize.js';
import validate from '../middleware/validate.js';
import { createCompanySchema, updateCompanySchema } from '../joi/company.js';

const router = express.Router();

// Route to create a new company
router.post('/companies', 
    validate(createCompanySchema), 
    attachResourceInfo('Company', 'Company', null, 'create'),
    checkAccess, 
    createCompany
);

// Route to update a company by its ID
router.put('/companies/:companyId',
    validate(updateCompanySchema), 
    attachResourceInfo('Company', 'Company', 'companyId', 'update'), 
    checkAccess, 
    updateCompany
);

// Route to get all companies
router.get('/companies', 
    attachResourceInfo('Company', 'Company', null, 'list'),
    checkAccess, 
    getAllCompanies
);

// Route to get a company by its ID
router.get('/companies/:companyId', 
    attachResourceInfo('Company', 'Company', 'companyId', 'read'), 
    checkAccess, 
    getCompanyById
);

// Route to delete a company by its ID
router.delete('/companies/:companyId', 
    attachResourceInfo('Company', 'Company', 'companyId', 'remove'), 
    checkAccess, 
    deleteCompany
);

export default router;
