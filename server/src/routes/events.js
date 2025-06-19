const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createEvent);
router.get('/', getEvents);
router.get('/:id', getEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;