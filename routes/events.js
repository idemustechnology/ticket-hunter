const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

router.get('/', eventsController.getAllEvents);
router.get('/categories', eventsController.getCategories);
router.get('/stats', eventsController.getStats);
router.get('/:id', eventsController.getEventById);

module.exports = router;