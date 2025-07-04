const express = require('express');
const parser = require('../config/multer'); // ✅ Multer middleware for image upload
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const {
    createLocation,
    deleteLocation,
    createHotel,
    updateHotel,    
    deleteHotel,
    createRoom,
    updateRoom,
    deleteRoom,
    getAllBookings,
    getBookingsByStatus

} = require('../controllers/adminController');

// Middleware-protected admin routes
router.use(isAuth, isAdmin);

// 🌍 Location routes
router.post('/locations', createLocation);
router.delete('/locations/:id', deleteLocation);

// 🏨 Hotel routes
router.post('/hotels', parser.single('image'), createHotel);
router.put('/hotels/:id', parser.single('image'), updateHotel); // Update hotel with image
router.delete('/hotels/:id', deleteHotel);

// 🛏️ Room routes
router.post('/rooms', parser.single('image'), createRoom);
router.put('/rooms/:id', updateRoom);
router.delete('/rooms/:id', deleteRoom);

// 📦 Booking routes
router.get('/bookings', getAllBookings);
router.post('/bookings/status', getBookingsByStatus);

module.exports = router;
