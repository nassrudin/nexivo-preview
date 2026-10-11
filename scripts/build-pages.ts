import { writeFile } from "node:fs/promises";
import { build } from "vite";
import { openDatabase } from "../server/db";

// Use only the reviewed seed topics. Never export the local application database.
const db = openDatabase(":memory:");
try {
  const events = db
    .prepare("SELECT * FROM events ORDER BY rowid")
    .all()
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      summary: e.summary,
      description: e.description,
      outcomes: JSON.parse(e.outcomes as string),
      status: e.status,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
      speaker: e.speaker,
      capacity: e.capacity,
      registered: 0,
      certificate: e.certificate,
      certificateFee: e.certificate_fee,
      minimumAttendance: e.minimum_attendance,
    }));
  await build({ mode: "pages", base: "./", build: { outDir: "dist-pages" } });
  await writeFile("dist-pages/preview-events.json", JSON.stringify({ events }));
  await writeFile("dist-pages/.nojekyll", "");
  console.log("Read-only GitHub Pages preview built in dist-pages/.");
} finally {
  db.close();
}
