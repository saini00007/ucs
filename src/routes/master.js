import express from 'express';
import { getRoles, getMasterDepartments } from '../controllers/master.js';

const router = express.Router();

router.get('/roles', getRoles);

router.get('/master-departments', getMasterDepartments);

export default router;
