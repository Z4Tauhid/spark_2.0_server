const admin = require('firebase-admin');
const path = require('path');

// Render writes Secret Files to /etc/secrets, not into the app directory
const serviceAccountPath = process.env.NODE_ENV === 'production'
  ? '/etc/secrets/serviceAccountKey.json'
  : path.join(__dirname, 'serviceAccountKey.json');

// Only initialise once — prevents duplicate app error on nodemon hot-reload
if (!admin.apps.length) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
