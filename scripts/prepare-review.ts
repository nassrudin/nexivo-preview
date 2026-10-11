// Optional, isolated browser-review fixtures. Never opens the application database.
import { openDatabase } from "../server/db";
import { hashPassword } from "../server/security";
const db = openDatabase("./artifacts/browser-review.sqlite");
db.prepare(
  "INSERT OR IGNORE INTO users(id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
).run(
  "review-admin",
  "Pengelola Pengujian",
  "admin@review.example.test",
  await hashPassword("Review-only-password!2026"),
  "admin",
  new Date().toISOString(),
);
db.close();
console.log(
  "Isolated browser-review database prepared. Use port 3001; do not use this database for real participants.",
);
