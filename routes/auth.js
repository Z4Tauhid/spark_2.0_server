const express   = require('express');
const router    = express.Router();
const jwt       = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User      = require('../models/User');
const admin     = require('../config/firebaseAdmin');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/register-firebase
   Called AFTER user verifies their email.
   Verifies Firebase ID token → saves full user to MongoDB
   → returns our JWT.
═══════════════════════════════════════════════════════════ */
router.post('/register-firebase', async (req, res) => {
  try {
    const { idToken, firstName, lastName, role } = req.body;

    if (!idToken)
      return res.status(400).json({ message: 'Firebase ID token is required.' });

    /* 1 — Verify the token with Firebase Admin */
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired Firebase token.' });
    }

    /* 2 — Confirm email is verified */
    if (!decoded.email_verified) {
      return res.status(403).json({
        message: 'Email not verified. Please click the link in your inbox first.',
      });
    }

    const { uid, email } = decoded;

    /* 3 — Already registered? Return existing user + fresh JWT */
    const existing = await User.findOne({ email });
    if (existing) {
      return res.json({
        token: generateToken(existing._id),
        user:  existing,
      });
    }

    /* 4 — Save to MongoDB with all info */
    const user = await User.create({
      firstName:   firstName || '',
      lastName:    lastName  || '',
      email,
      firebaseUid: uid,
      role:        role || 'trainee',
      isVerified:  true,
      authMethod:  'email',
    });

    res.status(201).json({ token: generateToken(user._id), user });

  } catch (err) {
    console.error('/register-firebase error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/login-firebase
   Called when user logs in with email + password.
   Firebase already validated the password on the client.
   We just verify the ID token and return our JWT.
═══════════════════════════════════════════════════════════ */
router.post('/login-firebase', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken)
      return res.status(400).json({ message: 'Firebase ID token is required.' });

    /* 1 — Verify token */
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired Firebase token.' });
    }

    const { email } = decoded;

    /* 2 — Find the user in MongoDB */
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: 'Account not found. Please register first.',
      });
    }

    /* 3 — Return our JWT */
    res.json({ token: generateToken(user._id), user });

  } catch (err) {
    console.error('/login-firebase error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/google
   Google popup login — upserts user in MongoDB.
═══════════════════════════════════════════════════════════ */
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken)
      return res.status(400).json({ message: 'Firebase ID token is required.' });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired Firebase token.' });
    }

    const { uid, email, name = '', picture } = decoded;
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ');

    /* Upsert — create if new, return existing if already registered */
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        firstName,
        lastName,
        email,
        firebaseUid: uid,
        avatar:      picture,
        role:        'trainee',
        isVerified:  true,
        authMethod:  'google',
      });
    }

    res.json({ token: generateToken(user._id), user });

  } catch (err) {
    console.error('/google error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════
   GET /api/auth/me
   Returns the currently logged-in user from MongoDB.
═══════════════════════════════════════════════════════════ */
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

/* ═══════════════════════════════════════════════════════════
   POST /api/auth/logout
   Stateless — client deletes the token.
═══════════════════════════════════════════════════════════ */
router.post('/logout', protect, (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
