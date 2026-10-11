import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { openDatabase } from "./db";
import {
  attendancePercent,
  digest,
  hashPassword,
  meetingUrlAllowed,
  randomToken,
  rateLimiter,
  safeEqual,
  securityHeaders,
  verifyPassword,
} from "./security";

type Row = Record<string, string | number | null>;
type Session = {
  token_hash: string;
  user_id: string | null;
  csrf: string;
  expires_at: number;
};
type Options = {
  databasePath: string;
  appUrl: string;
  production?: boolean;
  now?: () => number;
};
const category = z.enum([
  "Lingkungan",
  "Engineering",
  "HSE & K3",
  "Bisnis",
  "Teknologi",
  "Pendidikan",
]);
const plain = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .refine(
      (v) =>
        [...v].every(
          (c) => c.charCodeAt(0) >= 32 || ["\n", "\r", "\t"].includes(c),
        ),
      "Teks mengandung karakter yang tidak didukung.",
    );
const name = plain(100).pipe(z.string().min(2, "Nama minimal 2 karakter."));
const email = z
  .email()
  .max(254)
  .transform((v) => v.toLowerCase());
const password = z.string().min(12, "Gunakan minimal 12 karakter.").max(128);
const authSchema = z.object({ email, password });
const registerSchema = authSchema.extend({
  name,
  organization: plain(160).default(""),
  consent: z.literal(true),
});
const eventSchema = z
  .object({
    title: plain(150).pipe(z.string().min(10)),
    category,
    summary: plain(240).pipe(z.string().min(20)),
    description: plain(3000).pipe(z.string().min(40)),
    outcomes: z
      .array(plain(240).pipe(z.string().min(5)))
      .min(1)
      .max(6),
    status: z.enum(["planned", "published", "completed"]),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    speaker: name,
    capacity: z.number().int().min(1).max(10000),
    meetingUrl: z
      .string()
      .max(1000)
      .refine(
        meetingUrlAllowed,
        "Gunakan tautan HTTPS Zoom atau Google Meet yang valid.",
      ),
    attendanceCode: z.string().min(6).max(64),
    certificate: z.enum(["free", "paid", "none"]),
    certificateFee: z.number().int().min(0).max(10000000),
    minimumAttendance: z.number().int().min(1).max(100),
  })
  .refine(
    (v) => Date.parse(v.endsAt) > Date.parse(v.startsAt),
    "Waktu selesai harus setelah waktu mulai.",
  )
  .refine(
    (v) => v.certificate !== "paid" || v.certificateFee > 0,
    "Biaya sertifikat harus jelas.",
  );
class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function createApplication(options: Options) {
  const db = openDatabase(options.databasePath);
  const now = options.now ?? Date.now;
  const app = express();
  const expectedOrigin = new URL(options.appUrl).origin;
  const cookieName = options.production ? "__Host-nexivo" : "nexivo-session";
  const cookieOptions = {
    httpOnly: true,
    secure: !!options.production,
    sameSite: "strict" as const,
    path: "/",
    maxAge: 8 * 3600 * 1000,
  };
  app.disable("x-powered-by");
  app.use(securityHeaders(!!options.production));
  app.use("/api", rateLimiter(240, 60000));
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(express.json({ limit: "16kb", strict: true }));

  function session(req: Request): Session | undefined {
    const raw = (req.headers.cookie ?? "")
      .split(";")
      .map((p) => p.trim())
      .find((p) => p.startsWith(cookieName + "="))
      ?.slice(cookieName.length + 1);
    if (!raw || !/^[a-f0-9]{64}$/.test(raw)) return;
    return db
      .prepare("SELECT * FROM sessions WHERE token_hash=? AND expires_at>?")
      .get(digest(raw), now()) as Session | undefined;
  }
  function createSession(res: Response, userId: string | null) {
    db.prepare("DELETE FROM sessions WHERE expires_at<?").run(now());
    const raw = randomToken();
    const csrf = randomToken();
    db.prepare("INSERT INTO sessions VALUES (?,?,?,?)").run(
      digest(raw),
      userId,
      csrf,
      now() + 8 * 3600 * 1000,
    );
    res.cookie(cookieName, raw, cookieOptions);
    return csrf;
  }
  function publicUser(userId: string) {
    return db
      .prepare("SELECT id,name,email,role,organization FROM users WHERE id=?")
      .get(userId);
  }
  function requireUser(req: Request) {
    const current = session(req);
    if (!current?.user_id)
      throw new ApiError(401, "Masuk terlebih dahulu untuk melanjutkan.");
    return publicUser(current.user_id) as Row;
  }
  function requireAdmin(req: Request) {
    const user = requireUser(req);
    if (user.role !== "admin")
      throw new ApiError(403, "Halaman ini hanya untuk pengelola.");
    return user;
  }
  function audit(actor: Row, action: string, target: string, reason: string) {
    db.prepare("INSERT INTO audit_log VALUES (?,?,?,?,?,?)").run(
      randomUUID(),
      actor.id,
      action,
      target,
      reason,
      new Date(now()).toISOString(),
    );
  }
  function registration(req: Request, id: string, admin = false) {
    const user = admin ? requireAdmin(req) : requireUser(req);
    const row = db
      .prepare(
        `SELECT r.*, e.title,e.starts_at,e.ends_at,e.minimum_attendance,e.certificate,e.meeting_url,e.attendance_code_hash,e.certificate_fee
      FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.id=?`,
      )
      .get(id) as Row | undefined;
    if (!row || (!admin && row.user_id !== user.id))
      throw new ApiError(404, "Pendaftaran tidak ditemukan.");
    return row;
  }
  function eventList() {
    return (
      db
        .prepare(
          `SELECT e.*, (SELECT COUNT(*) FROM registrations r WHERE r.event_id=e.id) AS registered FROM events e ORDER BY CASE e.status WHEN 'published' THEN 0 WHEN 'planned' THEN 1 ELSE 2 END, e.starts_at, e.rowid`,
        )
        .all() as Row[]
    ).map((e) => ({
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
      registered: e.registered,
      certificate: e.certificate,
      certificateFee: e.certificate_fee,
      minimumAttendance: e.minimum_attendance,
    }));
  }
  app.use("/api", (req, _res, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      next();
      return;
    }
    const current = session(req);
    if (
      req.headers.origin !== expectedOrigin ||
      !current ||
      !safeEqual(String(req.headers["x-csrf-token"] ?? ""), current.csrf)
    ) {
      next(
        new ApiError(
          403,
          "Sesi tidak valid. Muat ulang halaman dan coba lagi.",
        ),
      );
      return;
    }
    next();
  });
  app.get("/api/session", (req, res) => {
    const current = session(req);
    res.json({
      user: current?.user_id ? publicUser(current.user_id) : null,
      csrf: current?.csrf ?? createSession(res, null),
    });
  });
  app.post(
    "/api/auth/register",
    rateLimiter(10, 15 * 60000),
    async (req, res) => {
      const data = registerSchema.parse(req.body);
      if (db.prepare("SELECT id FROM users WHERE email=?").get(data.email))
        throw new ApiError(409, "Email sudah digunakan. Silakan masuk.");
      const hash = await hashPassword(data.password);
      const id = randomUUID();
      try {
        db.prepare(
          "INSERT INTO users(id,name,email,password_hash,organization,created_at) VALUES(?,?,?,?,?,?)",
        ).run(
          id,
          data.name,
          data.email,
          hash,
          data.organization,
          new Date(now()).toISOString(),
        );
      } catch {
        throw new ApiError(409, "Email sudah digunakan. Silakan masuk.");
      }
      const previous = session(req);
      if (previous)
        db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
          previous.token_hash,
        );
      const csrf = createSession(res, id);
      res.status(201).json({ user: publicUser(id), csrf });
    },
  );
  app.post("/api/auth/login", rateLimiter(12, 15 * 60000), async (req, res) => {
    const data = authSchema.parse(req.body);
    const user = db
      .prepare("SELECT id,password_hash FROM users WHERE email=?")
      .get(data.email) as Row | undefined;
    const dummy = "00000000000000000000000000000000:" + "0".repeat(128);
    const valid = await verifyPassword(
      data.password,
      (user?.password_hash as string) ?? dummy,
    );
    if (!user || !valid)
      throw new ApiError(401, "Email atau kata sandi tidak sesuai.");
    const previous = session(req);
    if (previous)
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
        previous.token_hash,
      );
    res.json({
      user: publicUser(user.id as string),
      csrf: createSession(res, user.id as string),
    });
  });
  app.post("/api/auth/logout", (req, res) => {
    const current = session(req);
    if (current)
      db.prepare("DELETE FROM sessions WHERE token_hash=?").run(
        current.token_hash,
      );
    res.json({ user: null, csrf: createSession(res, null) });
  });
  app.put("/api/profile", (req, res) => {
    const user = requireUser(req);
    const data = z.object({ name, organization: plain(160) }).parse(req.body);
    db.prepare("UPDATE users SET name=?,organization=? WHERE id=?").run(
      data.name,
      data.organization,
      user.id,
    );
    res.json({ user: publicUser(user.id as string) });
  });
  app.get("/api/events", (_req, res) => res.json({ events: eventList() }));
  app.get("/api/me", (req, res) => {
    const user = requireUser(req);
    const rows = db
      .prepare(
        `SELECT r.*, e.title,e.category,e.starts_at,e.ends_at, c.token,c.status AS certificate_status,
      (SELECT COUNT(*) FROM evaluations v WHERE v.registration_id=r.id) AS evaluated,
      (SELECT rating FROM evaluations v WHERE v.registration_id=r.id) AS evaluation_rating,
      (SELECT learning FROM evaluations v WHERE v.registration_id=r.id) AS evaluation_learning
      FROM registrations r JOIN events e ON e.id=r.event_id LEFT JOIN certificates c ON c.registration_id=r.id WHERE r.user_id=? ORDER BY e.starts_at`,
      )
      .all(user.id) as Row[];
    res.json({
      bookmarks: db
        .prepare("SELECT event_id FROM bookmarks WHERE user_id=?")
        .all(user.id)
        .map((r) => r.event_id),
      registrations: rows.map((r) => ({
        id: r.id,
        eventId: r.event_id,
        title: r.title,
        category: r.category,
        startsAt: r.starts_at,
        endsAt: r.ends_at,
        checkedInAt: r.checked_in_at,
        checkedOutAt: r.checked_out_at,
        evaluated: !!r.evaluated,
        evaluationRating: r.evaluation_rating,
        evaluationLearning: r.evaluation_learning,
        wantsCertificate: !!r.wants_certificate,
        attendanceStatus: r.attendance_approved ? "approved" : "pending",
        certificateToken: r.token,
        certificateStatus: r.certificate_status,
      })),
    });
  });
  app.put("/api/bookmarks/:id", (req, res) => {
    const user = requireUser(req);
    const data = z.object({ saved: z.boolean() }).parse(req.body);
    if (
      !db
        .prepare("SELECT id FROM events WHERE id=?")
        .get(req.params.id as string)
    )
      throw new ApiError(404, "Program tidak ditemukan.");
    if (data.saved)
      db.prepare("INSERT OR IGNORE INTO bookmarks VALUES (?,?)").run(
        user.id,
        req.params.id as string,
      );
    else
      db.prepare("DELETE FROM bookmarks WHERE user_id=? AND event_id=?").run(
        user.id,
        req.params.id as string,
      );
    res.json({ saved: data.saved });
  });
  app.post("/api/interests", rateLimiter(8, 15 * 60000), (req, res) => {
    const data = z
      .object({
        name,
        email,
        category: category.or(z.literal("Semua bidang")),
        consent: z.literal(true),
      })
      .parse(req.body);
    db.prepare("INSERT OR IGNORE INTO interests VALUES (?,?,?,?,?,?)").run(
      randomUUID(),
      data.name,
      data.email,
      data.category,
      "2026-10-v1",
      new Date(now()).toISOString(),
    );
    res
      .status(201)
      .json({
        message:
          "Minatmu sudah tercatat untuk ditindaklanjuti pengelola setelah jadwal tersedia.",
      });
  });
  app.post("/api/events/:id/register", (req, res) => {
    const user = requireUser(req);
    const data = z
      .object({ wantsCertificate: z.boolean(), consent: z.literal(true) })
      .parse(req.body);
    const event = db
      .prepare("SELECT * FROM events WHERE id=?")
      .get(req.params.id as string) as Row | undefined;
    if (
      !event ||
      event.status !== "published" ||
      Date.parse(event.starts_at as string) <= now()
    )
      throw new ApiError(
        409,
        "Pendaftaran program ini belum dibuka atau sudah berakhir.",
      );
    db.exec("BEGIN IMMEDIATE");
    try {
      if (
        db
          .prepare(
            "SELECT id FROM registrations WHERE user_id=? AND event_id=?",
          )
          .get(user.id, event.id)
      )
        throw new ApiError(409, "Kamu sudah terdaftar di webinar ini.");
      const count = db
        .prepare("SELECT COUNT(*) AS total FROM registrations WHERE event_id=?")
        .get(event.id)!.total as number;
      if (count >= (event.capacity as number))
        throw new ApiError(409, "Kuota webinar sudah penuh.");
      const id = randomUUID();
      db.prepare(
        "INSERT INTO registrations(id,user_id,event_id,wants_certificate,created_at) VALUES(?,?,?,?,?)",
      ).run(
        id,
        user.id,
        event.id,
        Number(data.wantsCertificate && event.certificate !== "none"),
        new Date(now()).toISOString(),
      );
      db.exec("COMMIT");
      res
        .status(201)
        .json({
          id,
          message: "Pendaftaran berhasil. Webinar tersedia di Belajarku.",
        });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  });
  app.post(
    "/api/registrations/:id/check-in",
    rateLimiter(20, 60000),
    (req, res) => {
      const row = registration(req, req.params.id as string);
      const data = z
        .object({ code: z.string().min(1).max(64) })
        .parse(req.body);
      if (
        now() < Date.parse(row.starts_at as string) - 15 * 60000 ||
        now() > Date.parse(row.ends_at as string)
      )
        throw new ApiError(
          409,
          "Absensi hanya tersedia saat webinar berlangsung.",
        );
      if (
        !row.attendance_code_hash ||
        !safeEqual(digest(data.code), row.attendance_code_hash as string)
      )
        throw new ApiError(400, "Kode kehadiran tidak sesuai.");
      if (row.checked_in_at)
        throw new ApiError(409, "Absensi masuk sudah tercatat.");
      db.prepare("UPDATE registrations SET checked_in_at=? WHERE id=?").run(
        new Date(now()).toISOString(),
        row.id,
      );
      res.json({ message: "Absensi masuk tercatat." });
    },
  );
  app.post("/api/registrations/:id/check-out", (req, res) => {
    const row = registration(req, req.params.id as string);
    if (!row.checked_in_at || row.checked_out_at)
      throw new ApiError(
        409,
        "Catat absensi masuk terlebih dahulu, atau absensi akhir sudah tercatat.",
      );
    if (now() > Date.parse(row.ends_at as string) + 60 * 60000)
      throw new ApiError(
        409,
        "Batas absensi akhir sudah berakhir. Hubungi pengelola webinar.",
      );
    db.prepare("UPDATE registrations SET checked_out_at=? WHERE id=?").run(
      new Date(
        Math.min(now(), Date.parse(row.ends_at as string)),
      ).toISOString(),
      row.id,
    );
    res.json({
      message:
        "Absensi akhir tercatat. Isi evaluasi untuk melengkapi kegiatan.",
    });
  });
  app.post("/api/registrations/:id/evaluation", (req, res) => {
    const row = registration(req, req.params.id as string);
    const data = z
      .object({
        rating: z.number().int().min(1).max(5),
        learning: plain(1500).pipe(z.string().min(10)),
      })
      .parse(req.body);
    if (!row.checked_out_at)
      throw new ApiError(
        409,
        "Selesaikan absensi akhir sebelum mengisi evaluasi.",
      );
    db.prepare(
      "INSERT INTO evaluations VALUES (?,?,?,?) ON CONFLICT(registration_id) DO UPDATE SET rating=excluded.rating,learning=excluded.learning",
    ).run(row.id, data.rating, data.learning, new Date(now()).toISOString());
    res.json({
      message: "Evaluasi tersimpan. Pengelola akan memvalidasi kehadiranmu.",
    });
  });
  app.get("/api/registrations/:id/meeting", (req, res) => {
    const row = registration(req, req.params.id as string);
    if (
      now() < Date.parse(row.starts_at as string) - 15 * 60000 ||
      now() > Date.parse(row.ends_at as string)
    )
      throw new ApiError(
        409,
        "Ruang webinar dibuka 15 menit sebelum sesi dimulai.",
      );
    res.json({ url: row.meeting_url });
  });
  app.get("/api/certificates/:token", (req, res) => {
    const certificate = db
      .prepare("SELECT * FROM certificates WHERE token=?")
      .get(req.params.token as string) as Row | undefined;
    if (!certificate)
      throw new ApiError(
        404,
        "Sertifikat tidak ditemukan. Periksa kembali kode verifikasinya.",
      );
    const parts = (certificate.recipient_name as string).split(/\s+/u);
    const recipient = parts
      .map((part, index) => (index === 0 ? part : part[0] + "."))
      .join(" ");
    res.json({
      certificate: {
        token: certificate.token,
        number: certificate.number,
        recipient,
        event: certificate.event_title,
        date: certificate.event_date,
        issuedAt: certificate.issued_at,
        status: certificate.status,
        type: "Certificate of Participation",
      },
    });
  });
  app.get("/api/certificates/:token/pdf", async (req, res) => {
    const user = requireUser(req);
    const certificate = db
      .prepare(
        "SELECT c.*,r.user_id FROM certificates c JOIN registrations r ON r.id=c.registration_id WHERE c.token=?",
      )
      .get(req.params.token as string) as Row | undefined;
    if (
      !certificate ||
      (certificate.user_id !== user.id && user.role !== "admin")
    )
      throw new ApiError(404, "Sertifikat tidak ditemukan.");
    if (certificate.status !== "valid")
      throw new ApiError(409, "Sertifikat ini sudah dicabut.");
    const qr = await QRCode.toBuffer(
      `${options.appUrl}/#verifikasi/${certificate.token}`,
      { width: 160, margin: 1 },
    );
    const pdf = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 60,
      info: { Title: "NEXIVO Certificate of Participation" },
    });
    res.type("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${certificate.number}.pdf"`,
    );
    pdf.pipe(res);
    pdf.rect(22, 22, 798, 551).lineWidth(2).stroke("#137f82");
    pdf.fontSize(20).fillColor("#137f82").text("NEXIVO", { align: "center" });
    pdf
      .moveDown(1.2)
      .fontSize(30)
      .fillColor("#172b38")
      .text("Certificate of Participation", { align: "center" });
    pdf.moveDown().fontSize(12).text("Diberikan kepada", { align: "center" });
    pdf
      .moveDown(0.6)
      .fontSize(26)
      .text(certificate.recipient_name as string, { align: "center" });
    pdf
      .moveDown(0.7)
      .fontSize(12)
      .text("Atas partisipasinya dalam webinar", { align: "center" });
    pdf
      .moveDown(0.5)
      .fontSize(17)
      .text(certificate.event_title as string, { align: "center" });
    pdf
      .moveDown(0.6)
      .fontSize(12)
      .text(
        new Date(certificate.event_date as string).toLocaleDateString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "long",
        }),
        { align: "center" },
      );
    pdf.image(qr, 650, 420, { width: 85 });
    pdf
      .fontSize(10)
      .text(certificate.number as string, 60, 455, { width: 500 });
    pdf.text(
      "Verifikasi status dokumen melalui QR. Bukan sertifikat kompetensi.",
      60,
      475,
      { width: 550 },
    );
    pdf.end();
  });
  app.get("/api/admin/overview", (req, res) => {
    requireAdmin(req);
    res.json({
      events: eventList(),
      registrations: db
        .prepare(
          `SELECT r.id,r.event_id AS eventId,e.title,u.name,u.email,r.checked_in_at AS checkedInAt,r.checked_out_at AS checkedOutAt,r.attendance_approved AS approved,r.wants_certificate AS wantsCertificate,
      (SELECT COUNT(*) FROM evaluations v WHERE v.registration_id=r.id) AS evaluated,c.token,c.status AS certificateStatus
      FROM registrations r JOIN users u ON u.id=r.user_id JOIN events e ON e.id=r.event_id LEFT JOIN certificates c ON c.registration_id=r.id ORDER BY r.created_at DESC LIMIT 200`,
        )
        .all(),
      interestCount: db
        .prepare("SELECT COUNT(*) AS total FROM interests")
        .get()!.total,
      interests: db
        .prepare(
          "SELECT id,name,email,category,created_at AS createdAt FROM interests ORDER BY created_at DESC LIMIT 200",
        )
        .all(),
    });
  });
  app.post("/api/admin/events", (req, res) => {
    const user = requireAdmin(req);
    const data = eventSchema.parse(req.body);
    const id = randomUUID();
    if (data.status === "published" && Date.parse(data.startsAt) <= now())
      throw new ApiError(
        400,
        "Jadwal publikasi harus berada di masa mendatang.",
      );
    db.prepare(
      `INSERT INTO events(id,title,category,summary,description,outcomes,status,starts_at,ends_at,speaker,capacity,meeting_url,attendance_code_hash,certificate,certificate_fee,minimum_attendance)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    ).run(
      id,
      data.title,
      data.category,
      data.summary,
      data.description,
      JSON.stringify(data.outcomes),
      data.status,
      data.startsAt,
      data.endsAt,
      data.speaker,
      data.capacity,
      data.meetingUrl,
      digest(data.attendanceCode),
      data.certificate,
      data.certificate === "paid" ? data.certificateFee : 0,
      data.minimumAttendance,
    );
    audit(user, "event.created", id, "Program baru disimpan oleh pengelola.");
    res.status(201).json({ id });
  });
  app.post("/api/admin/registrations/:id/approve", (req, res) => {
    const user = requireAdmin(req);
    const row = registration(req, req.params.id as string, true);
    const { reason } = z
      .object({ reason: plain(500).pipe(z.string().min(10)) })
      .parse(req.body);
    const percent = attendancePercent(
      row.starts_at as string,
      row.ends_at as string,
      row.checked_in_at as string | null,
      row.checked_out_at as string | null,
    );
    if (
      percent < (row.minimum_attendance as number) ||
      now() < Date.parse(row.ends_at as string)
    )
      throw new ApiError(
        409,
        "Durasi kehadiran belum memenuhi syarat atau webinar belum selesai.",
      );
    db.prepare("UPDATE registrations SET attendance_approved=1 WHERE id=?").run(
      row.id,
    );
    audit(user, "attendance.approved", row.id as string, reason);
    res.json({ message: "Kehadiran telah divalidasi." });
  });
  app.post("/api/admin/registrations/:id/certificate", (req, res) => {
    const user = requireAdmin(req);
    const row = registration(req, req.params.id as string, true);
    const existing = db
      .prepare("SELECT token,status FROM certificates WHERE registration_id=?")
      .get(row.id);
    if (existing) {
      res.json(existing);
      return;
    }
    if (
      !row.wants_certificate ||
      row.certificate === "none" ||
      !row.attendance_approved ||
      !db
        .prepare(
          "SELECT registration_id FROM evaluations WHERE registration_id=?",
        )
        .get(row.id)
    )
      throw new ApiError(409, "Persyaratan sertifikat belum terpenuhi.");
    if (row.certificate === "paid")
      throw new ApiError(
        409,
        "Penerbitan sertifikat berbayar belum aktif. Integrasi pembayaran diperlukan.",
      );
    const participant = db
      .prepare("SELECT name FROM users WHERE id=?")
      .get(row.user_id)!;
    const token = randomToken();
    const number = `NXV-${new Date(now()).getUTCFullYear()}-${randomToken().slice(0, 12).toUpperCase()}`;
    db.prepare("INSERT INTO certificates VALUES (?,?,?,?,?,?,?,?)").run(
      token,
      number,
      row.id,
      participant.name,
      row.title,
      row.starts_at,
      "valid",
      new Date(now()).toISOString(),
    );
    audit(
      user,
      "certificate.issued",
      token,
      "Kehadiran tervalidasi dan evaluasi selesai.",
    );
    res.status(201).json({ token, status: "valid" });
  });
  app.post("/api/admin/certificates/:token/revoke", (req, res) => {
    const user = requireAdmin(req);
    const { reason } = z
      .object({ reason: plain(500).pipe(z.string().min(10)) })
      .parse(req.body);
    const result = db
      .prepare(
        "UPDATE certificates SET status='revoked' WHERE token=? AND status='valid'",
      )
      .run(req.params.token as string);
    if (!result.changes)
      throw new ApiError(404, "Sertifikat aktif tidak ditemukan.");
    audit(user, "certificate.revoked", req.params.token as string, reason);
    res.json({ message: "Sertifikat dicabut." });
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint tidak ditemukan." }),
  );
  app.use(
    (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
      void _next; // Express identifies error handlers by their four-argument signature.
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({
            error: "Periksa kembali isian formulir.",
            details: error.issues.map((i) => ({
              field: i.path.join("."),
              message: i.message,
            })),
          });
        return;
      }
      if (error instanceof ApiError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if ((error as { type?: string })?.type === "entity.too.large") {
        res.status(413).json({ error: "Permintaan terlalu besar." });
        return;
      }
      if (error instanceof SyntaxError) {
        res.status(400).json({ error: "Format permintaan tidak valid." });
        return;
      }
      console.error(
        "Request failed:",
        error instanceof Error ? error.name : "UnknownError",
      );
      if (!res.headersSent)
        res
          .status(500)
          .json({ error: "Terjadi kendala di server. Coba lagi sebentar." });
    },
  );
  return { app, db };
}
