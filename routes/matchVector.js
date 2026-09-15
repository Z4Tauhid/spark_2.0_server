const express     = require('express');
const router      = express.Router();
const MatchVector = require('../models/MatchVector');
const { protect, authorize } = require('../middleware/auth');

const AXIS_KEYS = ['hardSkills', 'softSkills', 'domain', 'languages', 'availability', 'trajectory', 'valuesFit'];

// GET /api/match-vector — get own Match Vector (null if not created yet)
router.get('/', protect, authorize('trainee'), async (req, res) => {
  try {
    const vector = await MatchVector.findOne({ user: req.user._id });
    res.json({ vector });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/match-vector — create or update own 7 axis scores
router.put('/', protect, authorize('trainee'), async (req, res) => {
  try {
    const update = {};
    for (const key of AXIS_KEYS) {
      if (req.body[key] === undefined) {
        return res.status(400).json({ message: `Missing axis value: ${key}` });
      }
      update[key] = req.body[key];
    }

    const vector = await MatchVector.findOneAndUpdate(
      { user: req.user._id },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({ vector });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/match-vector/interest — set (or clear) which opportunity the trainee expressed interest in
router.patch('/interest', protect, authorize('trainee'), async (req, res) => {
  try {
    const { opportunityId } = req.body;
    const vector = await MatchVector.findOneAndUpdate(
      { user: req.user._id },
      { expressedInterestId: opportunityId ?? null },
      { new: true }
    );
    if (!vector) {
      return res.status(404).json({ message: 'Save your Match Vector before expressing interest in a role.' });
    }
    res.json({ vector });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
