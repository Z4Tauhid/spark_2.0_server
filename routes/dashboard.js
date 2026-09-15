const express      = require('express');
const router       = express.Router();
const User         = require('../models/User');

// GET /api/dashboard/stats — public stats shown on the home page
router.get('/stats', async (req, res) => {
  try {
    const [trainees, organizations] = await Promise.all([
      User.countDocuments({ role: 'trainee' }),
      User.countDocuments({ role: 'organization' }),
    ]);
    res.json({
      stats: {
        trainees,
        organizations,
        openRoles:        1284,   // replace with live data source later
        completedMatches: 0,
        avgTimeToMatch:   4,
        municipalities:   14,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
