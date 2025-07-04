const express = require('express');
const router = express.Router();
const { validateBookingCode, invoiceDownloader, createBookingManually } = require('../controllers/bookingController');
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');

router.post('/manual', isAuth, isAdmin, createBookingManually);
router.post('/validate', validateBookingCode); // 🛎 Receptionist validates code
router.get('/download/:bookingCode', isAuth, invoiceDownloader);

module.exports = router;
