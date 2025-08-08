const express = require('express');
const router = express.Router();
const placesController = require('../controllers/places.controller');
router.get('/autocomplete', placesController.getPlaceAutocomplete);
router.get('/details', placesController.getPlaceDetails);

module.exports = router;