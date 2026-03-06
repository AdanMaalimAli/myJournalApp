const Trade = require('../models/Trade');

// @desc      Get all trades for logged in user
// @route     GET /api/trades
// @access    Private
exports.getTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user.id }).sort({ date: -1 });
    res.status(200).json({ success: true, count: trades.length, data: trades });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Create new trade
// @route     POST /api/trades
// @access    Private
exports.createTrade = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const trade = await Trade.create(req.body);
    res.status(201).json({ success: true, data: trade });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Update trade
// @route     PUT /api/trades/:id
// @access    Private
exports.updateTrade = async (req, res) => {
  try {
    let trade = await Trade.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    // Make sure user owns trade
    if (trade.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    trade = await Trade.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: trade });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Delete trade
// @route     DELETE /api/trades/:id
// @access    Private
exports.deleteTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);

    if (!trade) {
      return res.status(404).json({ success: false, error: 'Trade not found' });
    }

    if (trade.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    await trade.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Bulk create/update trades
// @route     POST /api/trades/bulk
// @access    Private
exports.bulkCreateTrades = async (req, res) => {
  try {
    const trades = req.body.trades;
    
    if (!Array.isArray(trades)) {
      return res.status(400).json({ success: false, error: 'Trades must be an array' });
    }

    const bulkOps = trades.map(trade => {
      const tradeData = { ...trade, user: req.user.id };
      const id = tradeData._id || tradeData.id;
      
      if (id && id.toString().length === 24) { // Valid MongoDB ObjectId
        const { _id, id: _, ...updateData } = tradeData;
        return {
          updateOne: {
            filter: { _id: id },
            update: { $set: updateData },
            upsert: true
          }
        };
      } else {
        // If no valid Mongo ID, try to match by ticket and user, or just insert
        if (tradeData.ticket) {
          const { ticket, ...updateData } = tradeData;
          return {
            updateOne: {
              filter: { user: req.user.id, ticket: ticket },
              update: { $set: { ...updateData, ticket } },
              upsert: true
            }
          };
        } else {
          return {
            insertOne: {
              document: tradeData
            }
          };
        }
      }
    });

    const result = await Trade.bulkWrite(bulkOps);
    
    // Fetch ALL trades for this user to ensure frontend is fully in sync
    const allTrades = await Trade.find({ user: req.user.id }).sort({ date: -1 });

    res.status(200).json({ 
      success: true, 
      count: result.upsertedCount + result.insertedCount + result.modifiedCount,
      data: allTrades 
    });
  } catch (err) {
    console.error('Bulk write error:', err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Reset all trades for user
// @route     DELETE /api/trades
// @access    Private
exports.resetTrades = async (req, res) => {
  try {
    await Trade.deleteMany({ user: req.user.id });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
