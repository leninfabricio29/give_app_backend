const admin = require('firebase-admin');

let isInitialized = false;

const initializeFirebase = () => {
  if (isInitialized) {
    console.log('Firebase Admin ya inicializado');
    return;
  }

  console.log('Initializing Firebase Admin SDK');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  isInitialized = true;
  console.log('Firebase Admin inicializado correctamente');
};

module.exports = {
  admin,
  initializeFirebase,
};
