import express from 'express';
import { 
  createCompany, 
  getAllCompanies, 
  getCompanyById,
  deleteCompany,
  updateCompany
} from '../controllers/company.js';
import validate from '../middleware/validate.js'; 
import companyValidation from '../joi/company.js'; 

const router = express.Router();

router.post('/companies', validate(companyValidation), createCompany);
router.put('/companies/:companyId', validate(companyValidation), updateCompany); 


router.get('/companies', getAllCompanies);

router.get('/companies/:companyId', getCompanyById);

router.delete('/companies/:companyId', deleteCompany);

export default router;
