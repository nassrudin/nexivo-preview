// Isolated UI fixtures. This never opens the application's database.
import { openDatabase } from "../server/db";
import { hashPassword } from "../server/security";

const db = openDatabase("./artifacts/interface-review.sqlite");
try {
  for (const [id, name, email, role] of [
    [
      "interface-admin",
      "Pengelola Pengujian",
      "admin@interface.example.test",
      "admin",
    ],
    [
      "interface-participant",
      "Peserta Pengujian",
      "participant@interface.example.test",
      "participant",
    ],
  ]) {
    db.prepare(
      "INSERT OR IGNORE INTO users(id,name,email,password_hash,role,created_at) VALUES(?,?,?,?,?,?)",
    ).run(
      id,
      name,
      email,
      await hashPassword("Interface-review-only!2026"),
      role,
      new Date().toISOString(),
    );
  }
} finally {
  db.close();
}
console.log(
  "Isolated interface-review database ready. Use port 3014, never for real participants.",
);
