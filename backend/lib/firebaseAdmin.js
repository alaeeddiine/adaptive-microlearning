const admin = require("firebase-admin");

function loadServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(rawJson);
    } catch {
      return null;
    }
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
      return null;
    }
    return serviceAccount;
  }

  const rawBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (rawBase64) {
    let serviceAccount;
    try {
      const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
      serviceAccount = JSON.parse(decoded);
    } catch {
      return null;
    }
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
    }
    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
      return null;
    }
    return serviceAccount;
  }

  return null;
}

function getFirebaseAdmin() {
  if (admin.apps.length) return admin;

  const serviceAccount = loadServiceAccount();
  if (serviceAccount) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      return admin;
    } catch {
      return null;
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      return admin;
    } catch {
      return null;
    }
  }

  return null;
}

module.exports = { getFirebaseAdmin };
