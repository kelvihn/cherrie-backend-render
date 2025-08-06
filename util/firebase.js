const admin = require('firebase-admin');
const serviceAccount = require('cherrie-cc66e-97abd22814a5.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
