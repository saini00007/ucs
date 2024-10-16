import express from 'express';
import { 
  createCompany, 
  getAllCompanies, 
  getCompanyById,
  deleteCompany,
  updateCompany
} from '../controllers/company.js';

const router = express.Router();

router.post('/companies',  createCompany); // Optional authorization


// Get all companies
router.get('/companies',getAllCompanies);

// Get a specific company by ID
router.get('/companies/:companyId', getCompanyById);
router.put('/companies/:companyId', updateCompany);

router.delete('/companies/:companyId',deleteCompany)

export default router;
