const express = require('express');
const router = express.Router();
const { listEvents } = require('../controllers/eventController');
const eventController = require('../controllers/eventController');

router.get('/', listEvents);
router.get('/event', eventController.listEvents);


module.exports = router;
