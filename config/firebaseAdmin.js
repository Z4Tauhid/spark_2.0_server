const admin = require('firebase-admin');

// Only initialise once — prevents duplicate app error on nodemon hot-reload
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
