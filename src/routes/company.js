// routes/company.js

import express from 'express';
import { createCompany, getAllCompanies, getCompanyById } from '../controllers/company.js';
const router = express.Router();

// Create Company
router.post('/', createCompany);

// Get All Companies
router.get('/', getAllCompanies);

// Get Specific Company by ID
router.get('/:id', getCompanyById);

export default router;
