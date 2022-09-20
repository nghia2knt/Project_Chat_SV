var admin = require("firebase-admin");
var serviceAccount = require("../key/firebaseadminkey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "megatalk-e6e2d.appspot.com/",
});

module.exports = { admin };
