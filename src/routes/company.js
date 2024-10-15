import express from 'express';
import { 
  createCompany, 
  getAllCompanies, 
  getCompanyById,
  deleteCompany,
  updateCompany
} from '../controllers/company.js';
import { authorize } from '../middleware/authorize.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

// Apply authentication middleware to all routes
// router.use(authenticate);

// Create a new company
// router.post('/', authorize(['admin', 'superadmin']), createCompany); // Optional authorization
router.post('/companies',  createCompany); // Optional authorization


// Get all companies
router.get('/companies', getAllCompanies);

// Get a specific company by ID
router.get('/companies/:id', getCompanyById);
router.put('/companies/:id', updateCompany);

router.delete('/companies/:id',deleteCompany)

export default router;
