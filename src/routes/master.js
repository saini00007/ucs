import express from 'express';
import { getRoles, getMasterDepartments, getIndustrySectors } from '../controllers/master.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';

const router = express.Router();

// Route to get a list of roles
router.get('/roles',
  attachResourceInfo('Role', null, null, 'list'),
  checkAccess,
  getRoles
);

// Route to get a list of master departments
router.get('/master-departments',
  attachResourceInfo('MasterDepartment', null, null, 'list'),
  checkAccess,
  getMasterDepartments
);

router.get('/industry-sectors',
  attachResourceInfo('IndustrySector', null, null, 'list'),
  checkAccess,
  getIndustrySectors
)

export default router;
