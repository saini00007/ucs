import express from 'express';
import { getRoles, getMasterDepartments, getIndustrySectors, getControlFrameworks } from '../controllers/master.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import checkAccess from '../middleware/authorize.js';
import { RESOURCE_TYPES, ACTION_IDS, CONTENT_RESOURCE_TYPES } from '../utils/constants.js';

const router = express.Router();

// Route to get a list of roles
router.get('/roles',
  attachResourceInfo(
    RESOURCE_TYPES.ROLE,
    null,
    null,
    ACTION_IDS.LIST
  ),
  checkAccess,
  getRoles
);

// Route to get a list of master departments
router.get('/master-departments',
  attachResourceInfo(
    RESOURCE_TYPES.MASTER_DEPARTMENT,
    null,
    null,
    ACTION_IDS.LIST
  ),
  checkAccess,
  getMasterDepartments
);

router.get('/industry-sectors',
  attachResourceInfo(
    RESOURCE_TYPES.INDUSTRY_SECTOR,
    null,
    null,
    ACTION_IDS.LIST
  ),
  checkAccess,
  getIndustrySectors
);

router.get('/control-frameworks',
  attachResourceInfo(
    RESOURCE_TYPES.CONTROL_FRAMEWORK,
    null,
    null,
    ACTION_IDS.LIST
  ),
  checkAccess,
  getControlFrameworks
);

export default router;