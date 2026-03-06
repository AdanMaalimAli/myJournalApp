const express = require('express');
const router = express.Router();
const { initiateSTKPush, mpesaCallback, checkPaymentStatus, verifyPayment } = require('../controllers/mpesaController');
const { protect } = require('../middleware/authMiddleware');

router.post('/stkpush', protect, initiateSTKPush);
router.post('/callback', mpesaCallback); // Public for Safaricom
router.get('/status', protect, checkPaymentStatus);
router.get('/verify', protect, verifyPayment);

module.exports = router;
