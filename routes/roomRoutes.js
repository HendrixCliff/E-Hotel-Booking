const express = require('express');
const router = express.Router();
const {
  getRoomsByHotel,
  getAvailableRooms
} = require('../controllers/roomController');


// All rooms in a hotel
router.post('/get-rooms', getRoomsByHotel);

// Only available rooms
router.post('/available', getAvailableRooms);

module.exports = router;
