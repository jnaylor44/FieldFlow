const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const reportTemplateController = require('../controllers/report-template.controller');
router.use(authMiddleware);
router.get('/', reportTemplateController.listTemplates);
router.get('/:id', reportTemplateController.getTemplate);
router.post('/', reportTemplateController.createTemplate);
router.put('/:id', reportTemplateController.updateTemplate);
router.delete('/:id', reportTemplateController.deleteTemplate);

module.exports = router;