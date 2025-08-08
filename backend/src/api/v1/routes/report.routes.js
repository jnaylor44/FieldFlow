const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');
router.use(authMiddleware);
router.get('/', reportController.listReports);
router.get('/:id', reportController.getReport);
router.post('/', reportController.createReport);
router.put('/:id', reportController.updateReport);
router.delete('/:id', reportController.deleteReport);
router.get('/:id/pdf', reportController.generatePDF);
router.post('/:id/send', reportController.sendReport);

module.exports = router;