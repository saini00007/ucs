import express from 'express';
import { createCompany, getAllCompanies, getCompanyById } from '../controllers/company.js';
import { authorize } from '../middleware/authorize.js';
import { authenticate } from '../middleware/authenticate.js';
const router = express.Router();

// Create Company
router.post('/', createCompany);

// Get All Companies
router.get('/',authenticate,authorize([1]),getAllCompanies);

// Get Specific Company by ID
router.get('/:id', getCompanyById);

export default router;
