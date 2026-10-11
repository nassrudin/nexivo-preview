// Controlled completed-webinar fixtures only, in the isolated review database.
import { openDatabase } from "../server/db";
import { digest, hashPassword } from "../server/security";
const db = openDatabase("./artifacts/browser-review.sqlite");
const started = new Date(Date.now() - 2 * 3600000).toISOString();
const ended = new Date(Date.now() - 3600000).toISOString();
db.prepare(
  "INSERT OR IGNORE INTO users(id,name,email,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
).run(
  "certificate-review-user",
  "Citra Pembelajar",
  "certificate@review.example.test",
  await hashPassword("Certificate-review-password!2026"),
  "participant",
  started,
);
db.prepare(
  "INSERT OR IGNORE INTO events(id,title,category,summary,description,outcomes,status,starts_at,ends_at,speaker,capacity,meeting_url,attendance_code_hash) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
).run(
  "certificate-review-event",
  "Webinar selesai khusus pengujian sertifikat",
  "Pendidikan",
  "Acara khusus pengujian lokal.",
  "Fixture kegiatan selesai untuk memeriksa evaluasi dan penerbitan sertifikat melalui browser.",
  JSON.stringify(["Memahami pembelajaran dan evaluasi"]),
  "completed",
  started,
  ended,
  "Narasumber Pengujian",
  10,
  "https://meet.google.com/abc-defg-hij",
  digest("CERTIFICATE-REVIEW"),
);
db.prepare(
  "INSERT OR IGNORE INTO registrations(id,user_id,event_id,wants_certificate,checked_in_at,checked_out_at,created_at) VALUES(?,?,?,?,?,?,?)",
).run(
  "certificate-review-registration",
  "certificate-review-user",
  "certificate-review-event",
  1,
  started,
  ended,
  started,
);
db.close();
console.log(
  "Completed-webinar fixture prepared in the isolated browser-review database. Attendance timestamps are simulated for UI review.",
);
