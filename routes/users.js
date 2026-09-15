const express    = require('express');
const router     = express.Router();
const User       = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/users/profile — get own profile
router.get('/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/users/profile — update own profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { firstName, lastName, profile } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, profile },
      { new: true, runValidators: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/users — admin only: list all users
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const users = await User.find().skip((page - 1) * limit).limit(limit);
    const total = await User.countDocuments();
    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
