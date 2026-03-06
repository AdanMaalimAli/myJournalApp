const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  html: {
    type: String,
  },
  rating: {
    type: Number,
  },
  condition: {
    type: String,
  },
  moods: {
    type: [String],
  },
  mistakes: {
    type: [String],
  },
  setups: {
    type: [String],
  },
  images: {
    type: [String],
  }
}, {
  timestamps: true,
});

// Ensure one entry per user per day
journalEntrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
