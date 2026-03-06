const JournalEntry = require('../models/JournalEntry');

// @desc      Get all journal entries for user
// @route     GET /api/journal
// @access    Private
exports.getJournalEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user.id });
    res.status(200).json({ success: true, data: entries });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Upsert journal entry (Create or Update)
// @route     POST /api/journal
// @access    Private
exports.upsertJournalEntry = async (req, res) => {
  try {
    const { date, html, rating, condition, moods, mistakes, setups, images } = req.body;
    
    const entry = await JournalEntry.findOneAndUpdate(
      { user: req.user.id, date },
      { html, rating, condition, moods, mistakes, setups, images },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: entry });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc      Reset all journal entries for user
// @route     DELETE /api/journal
// @access    Private
exports.resetJournal = async (req, res) => {
  try {
    await JournalEntry.deleteMany({ user: req.user.id });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
