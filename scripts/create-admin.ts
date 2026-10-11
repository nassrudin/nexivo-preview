import { randomUUID } from "node:crypto";
import { z } from "zod";
import { openDatabase } from "../server/db";
import { hashPassword } from "../server/security";

const email = z.email().parse(process.env.NEXIVO_ADMIN_EMAIL).toLowerCase();
const password = z
  .string()
  .min(16)
  .max(128)
  .parse(process.env.NEXIVO_ADMIN_PASSWORD);
const db = openDatabase(process.env.DATABASE_PATH || "./data/nexivo.sqlite");
if (db.prepare("SELECT id FROM users WHERE email=?").get(email))
  throw new Error(
    "Email already exists. Existing accounts are not promoted automatically.",
  );
db.prepare(
  "INSERT INTO users(id,name,email,password_hash,role,created_at) VALUES(?,?,?,?,?,?)",
).run(
  randomUUID(),
  "Pengelola NEXIVO",
  email,
  await hashPassword(password),
  "admin",
  new Date().toISOString(),
);
db.close();
console.log(
  "Administrator created. Sign in with the email and password you supplied.",
);
