const express = require('express');
const router = express.Router();
const {
  getTrades,
  createTrade,
  updateTrade,
  deleteTrade,
  bulkCreateTrades,
  resetTrades
} = require('../controllers/tradeController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getTrades)
  .post(createTrade)
  .delete(resetTrades);

router.post('/bulk', bulkCreateTrades);

router.route('/:id')
  .put(updateTrade)
  .delete(deleteTrade);

module.exports = router;
