import admin from "firebase-admin";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// const serviceAccount = require("./serviceAccount.json");
import dotenv from "dotenv";
dotenv.config();

const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT as string
);
// console.log("serviceAccount", process.env.FIREBASE_SERVICE_ACCOUNT);
console.log("serviceAccount", serviceAccount);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export default admin;
