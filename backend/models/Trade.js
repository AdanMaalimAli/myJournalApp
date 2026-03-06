const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ticket: {
    type: String,
  },
  date: {
    type: String, // Storing as string to match existing frontend format YYYY-MM-DD
    required: true,
  },
  pair: {
    type: String,
    required: true,
  },
  type: {
    type: String,
  },
  pnl: {
    type: Number,
    required: true,
  },
  entry: {
    type: Number,
  },
  exit: {
    type: Number,
  },
  sl: {
    type: Number,
  },
  tp: {
    type: Number,
  },
  duration: {
    type: String,
  },
  lots: {
    type: Number,
  },
  commission: {
    type: Number,
  },
  roi: {
    type: Number,
  },
  notes: {
    type: String,
  },
  setup: {
    type: String,
  },
  journalNote: {
    type: String,
  },
  journalImages: {
    type: [String],
  },
  emotions: {
    type: [String],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Trade', tradeSchema);
