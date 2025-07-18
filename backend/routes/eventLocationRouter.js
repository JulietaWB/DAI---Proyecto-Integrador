const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  listEventLocations,
  getEventLocationById,
  createEventLocation,
  updateEventLocation,
  deleteEventLocation,
} = require('../controllers/eventLocationController');

router.use(verifyToken);

router.get('/', listEventLocations);               // GET /api/event-location
router.get('/:id', getEventLocationById);          // GET /api/event-location/:id
router.post('/', createEventLocation);             // POST /api/event-location
router.put('/:id', updateEventLocation);           // PUT /api/event-location/:id
router.delete('/:id', deleteEventLocation);        // DELETE /api/event-location/:id

module.exports = router;
