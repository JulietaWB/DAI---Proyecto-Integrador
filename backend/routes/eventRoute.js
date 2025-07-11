const express = require('express');
const router = express.Router();
const { listEvents } = require('../db/eventController');
const eventController = require('../db/eventController');

router.get('/', listEvents);
router.get('/event', eventController.listEvents);
router.get('/:id', eventController.getEventDetail);


module.exports = router;
