const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const { initiateBankTransfer, flutterwaveWebhook } = require('../controllers/paymentController');


router.post('/bank-transfer', isAuth, initiateBankTransfer);
router.post('/webhook', express.raw({ type: '*/*' }), flutterwaveWebhook); 

module.exports = router;
