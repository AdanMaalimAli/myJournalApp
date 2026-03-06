const express = require('express');
const router = express.Router();
const { connectBroker, syncBrokerTrades } = require('../controllers/brokerController');
const { protect } = require('../middleware/authMiddleware');

router.post('/connect', protect, connectBroker);
router.post('/sync', protect, syncBrokerTrades);

module.exports = router;
