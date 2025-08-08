const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const workerController = require('../controllers/worker.controller');
router.use(authMiddleware);
router.get('/:id', workerController.getWorker);
router.get('/', workerController.listWorkers);
router.get('/:id/schedule', workerController.getWorkerSchedule);
router.get('/:id/jobs', workerController.getWorkerJobs);
router.get('/:id/metrics', workerController.getWorkerMetrics);
router.post('/:id/time-entries', workerController.createTimeEntry);
router.get('/:id/time-entries', workerController.getTimeEntries);

module.exports = router;