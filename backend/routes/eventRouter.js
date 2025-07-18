const { listEvents } = require('../controllers/eventController');
const eventController = require('../controllers/eventController');
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  getEventDetail,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');

router.get('/', listEvents);
router.get('/:id', getEventDetail);
router.post('/', verifyToken, createEvent);
router.put('/', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);
router.post('/:id/enrollment', verifyToken, eventController.registerUserToEvent);
router.delete('/:id/enrollment', verifyToken, eventController.unregisterUserFromEvent);

module.exports = router;
