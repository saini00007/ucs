import express from 'express';
import { 
  createCompany, 
  getAllCompanies, 
  getCompanyById,
  deleteCompany,
  updateCompany
} from '../controllers/company.js';
import { authorizeCompany } from '../middleware/authorize/authorizeCompany.js';

const router = express.Router();

import mockAuthenticate from '../middleware/mockAuth.js';
import { authenticate } from '../middleware/authenticate.js';
const authMiddleware = process.env.USE_MOCK_AUTH === 'true' ? mockAuthenticate : authenticate;
router.use(authMiddleware);

router.post('/companies',  createCompany); // Optional authorization


// Get all companies
router.get('/companies',authorizeCompany(['1']),getAllCompanies);

// Get a specific company by ID
router.get('/companies/:companyId',authorizeCompany(['1','2','3']), getCompanyById);
router.put('/companies/:companyId',authorizeCompany(['1']), updateCompany);

router.delete('/companies/:companyId',authorizeCompany(['1']),deleteCompany)

export default router;
