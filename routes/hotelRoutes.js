const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getHotelsByLocation
} = require('../controllers/hotelController');

// ✅ Location routes
router.get('/locations', getAllLocations);

// ✅ Hotel routes

router.post('/', getHotelsByLocation); // with ?location=id

module.exports = router;
