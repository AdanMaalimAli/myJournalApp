const express = require('express');
const router = express.Router();
const {
  getJournalEntries,
  upsertJournalEntry,
  resetJournal
} = require('../controllers/journalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getJournalEntries)
  .post(upsertJournalEntry)
  .delete(resetJournal);

module.exports = router;
