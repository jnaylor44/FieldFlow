
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../../middleware/auth.middleware');
const locationController = require('../controllers/location.controller');
router.use(authMiddleware);
router.post('/update', locationController.updateLocation);
router.get('/worker/:workerId', locationController.getWorkerLocations);
router.get('/workers', locationController.getAllWorkerLocations);
router.get('/jobs', locationController.getActiveJobLocations);

module.exports = router;