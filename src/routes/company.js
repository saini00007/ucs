import express from 'express';
import { 
  createCompany, 
  getAllCompanies, 
  getCompanyById,
  deleteCompany,
  updateCompany
} from '../controllers/company.js';
import validate from '../middleware/validate.js'; 
import {createCompanySchema, updateCompanySchema}from '../joi/company.js'; 

const router = express.Router();

router.post('/companies', validate(createCompanySchema), createCompany);
router.put('/companies/:companyId', validate(updateCompanySchema), updateCompany); 


router.get('/companies', getAllCompanies);

router.get('/companies/:companyId', getCompanyById);

router.delete('/companies/:companyId', deleteCompany);

export default router;
