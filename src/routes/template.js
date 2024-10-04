import express from 'express';
const router = express.Router();

import {
    createTemplateFromDepartment,
    createEmptyTemplate,
    addQuestionsToTemplate,
    removeQuestionsFromTemplate,
    deleteTemplate
  } from '../controllers/template.js'
router.post('/create-from-department', createTemplateFromDepartment);

router.post('/create-empty', createEmptyTemplate);

router.post('/add-questions', addQuestionsToTemplate);

router.delete('/remove-questions', removeQuestionsFromTemplate);

router.delete('/:templateId', deleteTemplate);

export default router;
