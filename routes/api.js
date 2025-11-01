const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController.js');

router.get('/health', apiController.healthCheck);
router.get('/platforms', apiController.getPlatforms);

module.exports = router;