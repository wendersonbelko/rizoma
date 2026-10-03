import { randomBytes } from "node:crypto";
console.log(`ENCRYPTION_KEY="${randomBytes(32).toString("base64")}"`);
console.log(`AUTH_SECRET="${randomBytes(32).toString("base64url")}"`);
