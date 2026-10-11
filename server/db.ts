import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function openDatabase(path: string) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, organization TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'participant' CHECK(role IN ('participant','admin')),
      created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      csrf TEXT NOT NULL, expires_at INTEGER NOT NULL
    ) STRICT;
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL,
      summary TEXT NOT NULL, description TEXT NOT NULL, outcomes TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planned' CHECK(status IN ('planned','published','completed')),
      starts_at TEXT, ends_at TEXT, speaker TEXT, capacity INTEGER NOT NULL DEFAULT 100,
      meeting_url TEXT, attendance_code_hash TEXT,
      certificate TEXT NOT NULL DEFAULT 'free' CHECK(certificate IN ('free','paid','none')),
      certificate_fee INTEGER NOT NULL DEFAULT 0,
      minimum_attendance INTEGER NOT NULL DEFAULT 80
    ) STRICT;
    CREATE TABLE IF NOT EXISTS bookmarks (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      PRIMARY KEY(user_id,event_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
      event_id TEXT NOT NULL REFERENCES events(id), wants_certificate INTEGER NOT NULL,
      checked_in_at TEXT, checked_out_at TEXT, attendance_approved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, UNIQUE(user_id,event_id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS evaluations (
      registration_id TEXT PRIMARY KEY REFERENCES registrations(id),
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      learning TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS certificates (
      token TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE,
      registration_id TEXT NOT NULL UNIQUE REFERENCES registrations(id),
      recipient_name TEXT NOT NULL, event_title TEXT NOT NULL, event_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('valid','revoked')), issued_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY, actor_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS interests (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL,
      category TEXT NOT NULL, consent_version TEXT NOT NULL,
      created_at TEXT NOT NULL, UNIQUE(email,category)
    ) STRICT;
    PRAGMA user_version = 1;
  `);
  const items = [
    [
      "lingkungan-lb3",
      "Pengelolaan Limbah B3 & Lingkungan",
      "Lingkungan",
      "Dari pemahaman dasar menuju praktik yang lebih bertanggung jawab.",
      "Rencana webinar pengantar pengelolaan limbah B3, keselamatan transportasi, dan dokumentasi lingkungan. Materi akan disesuaikan setelah narasumber dan jadwal dikonfirmasi.",
      [
        "Memahami siklus pengelolaan limbah B3",
        "Mengenali risiko transportasi dan penyimpanan",
        "Mengenal dokumentasi pengelolaan lingkungan",
      ],
    ],
    [
      "engineering-excellence",
      "Engineering & Operational Excellence",
      "Engineering",
      "Bangun cara berpikir sistematis untuk memecahkan tantangan operasional.",
      "Rencana diskusi tentang pemecahan masalah engineering, perbaikan proses, dan pengembangan budaya operational excellence.",
      [
        "Memetakan masalah operasional",
        "Mengenal pendekatan PDCA",
        "Menghubungkan perbaikan proses dan indikator kinerja",
      ],
    ],
    [
      "hse-risk",
      "HSE, K3 & Manajemen Risiko",
      "HSE & K3",
      "Mulai dari mengenali risiko. Tumbuhkan budaya kerja yang lebih aman.",
      "Rencana webinar pengantar identifikasi bahaya, penilaian risiko, dan budaya keselamatan. Program ini bukan sertifikasi kompetensi K3.",
      [
        "Mengenali bahaya di lingkungan kerja",
        "Memahami prinsip penilaian risiko",
        "Mendiskusikan budaya keselamatan",
      ],
    ],
    [
      "bisnis-growth",
      "Strategi Bisnis & Pengembangan Profesional",
      "Bisnis",
      "Perspektif baru untuk keputusan bisnis dan perjalanan kariermu.",
      "Rencana sesi berbagi pengetahuan mengenai strategi usaha, pengembangan profesional, dan kolaborasi lintas disiplin.",
      [
        "Memetakan tantangan bisnis",
        "Mengenal perencanaan pengembangan profesional",
        "Membangun pola pikir kolaboratif",
      ],
    ],
    [
      "digital-productivity",
      "Teknologi & Produktivitas Digital",
      "Teknologi",
      "Kenali alat dan pendekatan digital yang relevan untuk pekerjaanmu.",
      "Rencana webinar tentang pemanfaatan teknologi untuk mendukung produktivitas dan pembelajaran, dengan pembahasan penggunaan yang bertanggung jawab.",
      [
        "Mengenali peluang digitalisasi",
        "Mengevaluasi alat produktivitas",
        "Memahami batasan dan tanggung jawab penggunaan teknologi",
      ],
    ],
    [
      "learning-connect",
      "Pembelajaran & Kolaborasi Akademik",
      "Pendidikan",
      "Jembatani pengetahuan akademik dengan pengalaman dunia profesional.",
      "Rencana forum berbagi pengetahuan bagi mahasiswa, akademisi, dan praktisi untuk mempertemukan pembelajaran dan persoalan nyata.",
      [
        "Menghubungkan teori dan praktik",
        "Membangun kebiasaan belajar berkelanjutan",
        "Mengenal kolaborasi akademik dan industri",
      ],
    ],
  ];
  const insert = db.prepare(
    "INSERT OR IGNORE INTO events (id,title,category,summary,description,outcomes) VALUES (?,?,?,?,?,?)",
  );
  for (const [id, title, category, summary, description, outcomes] of items) {
    insert.run(
      id as string,
      title as string,
      category as string,
      summary as string,
      description as string,
      JSON.stringify(outcomes),
    );
  }
  return db;
}
