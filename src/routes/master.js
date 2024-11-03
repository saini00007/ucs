import express from 'express';
import { getRoles, getMasterDepartments } from '../controllers/master.js';
import attachResourceInfo from '../utils/attachResourceInfo.js';
import { checkAccess } from '../middleware/authorize.js';

const router = express.Router();

router.get('/roles', attachResourceInfo('Role', 'Role', null, 'list'),checkAccess, getRoles);

router.get('/master-departments', attachResourceInfo('MasterDepartment', 'MasterDepartment', null, 'list'), checkAccess, getMasterDepartments);

export default router;
