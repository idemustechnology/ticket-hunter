const express = require('express');
const router = express.Router();
const FlightsController = require('../controllers/flightsController');

router.get('/search', FlightsController.searchFlights);
router.get('/popular-routes', FlightsController.getPopularRoutes);
router.get('/airlines', FlightsController.getAirlines);

module.exports = router;