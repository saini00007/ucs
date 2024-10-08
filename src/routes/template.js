import express from 'express';
const router = express.Router();

import {
    createTemplateFromMasterDepartment,
    createEmptyTemplate,
    addQuestionsToTemplate,
    removeQuestionsFromTemplate,
    deleteTemplate,
    assignTemplateToDepartment,
    getTemplatesByDepartment
  } from '../controllers/template.js'
router.post('/create-from-department', createTemplateFromMasterDepartment);

router.post('/create-empty', createEmptyTemplate);

router.post('/add-questions', addQuestionsToTemplate);

router.delete('/remove-questions', removeQuestionsFromTemplate);

router.delete('/:templateId', deleteTemplate);

router.post('/assign-templates',assignTemplateToDepartment);

router.get('/department/:departmentId',getTemplatesByDepartment);

export default router;
