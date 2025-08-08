
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const jobController = require('../controllers/job.controller');
router.use(authMiddleware);
router.get('/', jobController.listJobs);
router.post('/', jobController.createJob);
router.get('/:id', jobController.getJob);
router.put('/:id', jobController.updateJob);
router.delete('/:id', jobController.deleteJob);
router.post('/:id/assign', jobController.assignJob);
router.post('/:id/start', jobController.startJob);
router.post('/:id/complete', jobController.completeJob);

module.exports = router;