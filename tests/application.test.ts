import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import type { Server } from "node:http";
import { createApplication } from "../server/app";

let currentTime = Date.parse("2026-11-01T00:00:00Z");
const { app, db } = createApplication({
  databasePath: ":memory:",
  appUrl: "http://nexivo.test",
  now: () => currentTime,
});
let server: Server;
let base: string;
before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}/api`;
});
after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
});
class Client {
  cookie = "";
  csrf = "";
  async request(
    path: string,
    method = "GET",
    data?: unknown,
    headers: Record<string, string> = {},
  ) {
    const response = await fetch(base + path, {
      method,
      headers: {
        Cookie: this.cookie,
        Origin: "http://nexivo.test",
        "X-CSRF-Token": this.csrf,
        ...(data === undefined ? {} : { "Content-Type": "application/json" }),
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const cookie = response.headers.get("set-cookie");
    if (cookie) this.cookie = cookie.split(";")[0];
    return response;
  }
  async json(path: string, method = "GET", data?: unknown, expected = 200) {
    const response = await this.request(path, method, data);
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    if (result.csrf) this.csrf = result.csrf;
    return result;
  }
  async account(email: string, name = "Peserta Pengujian") {
    await this.json("/session");
    return this.json(
      "/auth/register",
      "POST",
      {
        email,
        name,
        password: "Long-test-password!2026",
        consent: true,
        organization: "Test",
        role: "admin",
      },
      201,
    );
  }
}
const participant = new Client();
const other = new Client();
const admin = new Client();
const anonymous = new Client();
let registrationId: string;
let eventId: string;
let certificateToken: string;
const event = {
  title: "Webinar Pengujian Lokal NEXIVO",
  category: "Teknologi",
  summary: "Kegiatan khusus pengujian lokal, bukan webinar publik.",
  description:
    "Acara pengujian untuk memeriksa keamanan dan perilaku aplikasi secara menyeluruh.",
  outcomes: ["Memahami perilaku aplikasi"],
  status: "published",
  startsAt: "2026-11-01T01:00:00Z",
  endsAt: "2026-11-01T02:00:00Z",
  speaker: "Narasumber Pengujian",
  capacity: 1,
  meetingUrl: "https://meet.google.com/abc-defg-hij",
  attendanceCode: "TEST-CODE-2026",
  certificate: "free",
  certificateFee: 0,
  minimumAttendance: 80,
};

test("sessions, server validation, CSRF, role boundaries and hashed storage", async () => {
  const session = await anonymous.request("/session");
  assert.equal(session.status, 200);
  anonymous.csrf = (await session.json()).csrf;
  assert.match(session.headers.get("set-cookie")!, /HttpOnly/i);
  assert.match(session.headers.get("set-cookie")!, /SameSite=Strict/i);
  assert.equal(session.headers.get("cache-control"), "no-store");
  assert.match(
    session.headers.get("content-security-policy")!,
    /frame-ancestors 'none'/,
  );
  assert.equal(
    (await anonymous.request("/interests", "POST", {}, { "X-CSRF-Token": "" }))
      .status,
    403,
  );
  assert.equal(
    (
      await anonymous.request(
        "/interests",
        "POST",
        {},
        { Origin: "https://evil.test" },
      )
    ).status,
    403,
  );
  await anonymous.json(
    "/auth/register",
    "POST",
    { email: "broken", name: "A", password: "short", consent: false },
    400,
  );
  await anonymous.json("/me", "GET", undefined, 401);
  const beforeCookie = participant.cookie;
  const created = await participant.account(
    "participant@example.test",
    "Alya Test Person",
  );
  assert.equal(created.user.role, "participant");
  assert.notEqual(participant.cookie, beforeCookie);
  assert.ok(!("password_hash" in created.user));
  const stored = db
    .prepare("SELECT password_hash FROM users WHERE email=?")
    .get("participant@example.test")!;
  assert.notEqual(stored.password_hash, "Long-test-password!2026");
  assert.equal(
    db
      .prepare("SELECT COUNT(*) AS count FROM sessions WHERE token_hash=?")
      .get(participant.cookie.split("=")[1])!.count,
    0,
  );
  await other.account("other@example.test");
  const managed = await admin.account("admin@example.test");
  db.prepare("UPDATE users SET role='admin' WHERE id=?").run(managed.user.id); // Fixture setup only: production has a separate terminal command.
  await participant.json("/admin/overview", "GET", undefined, 403);
  await participant.json("/profile", "PUT", {
    name: "Alya Test Person",
    organization: "Test",
    role: "admin",
  });
  assert.equal((await participant.json("/session")).user.role, "participant");
});

test("catalog keeps meeting links private; bookmarks are isolated; interest consent is required", async () => {
  const catalog = await anonymous.json("/events");
  assert.equal(catalog.events.length, 6);
  assert.ok(
    catalog.events.every(
      (e: Record<string, unknown>) =>
        e.status === "planned" && !e.meeting_url && !e.attendance_code_hash,
    ),
  );
  await participant.json("/bookmarks/lingkungan-lb3", "PUT", { saved: true });
  assert.deepEqual((await participant.json("/me")).bookmarks, [
    "lingkungan-lb3",
  ]);
  assert.deepEqual((await other.json("/me")).bookmarks, []);
  await anonymous.json(
    "/interests",
    "POST",
    {
      name: "Peserta Test",
      email: "interest@example.test",
      category: "Bisnis",
      consent: false,
    },
    400,
  );
  for (let i = 0; i < 2; i++)
    await anonymous.json(
      "/interests",
      "POST",
      {
        name: "Peserta Test",
        email: "interest@example.test",
        category: "Bisnis",
        consent: true,
      },
      201,
    );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS count FROM interests").get()!.count,
    1,
  );
  const managed = await admin.json("/admin/overview");
  assert.equal(managed.interests[0].email, "interest@example.test");
  await other.json("/admin/overview", "GET", undefined, 403);
});

test("only admin creates validated events; registration is unique, capacity enforced under concurrent requests", async () => {
  await participant.json("/admin/events", "POST", event, 403);
  await admin.json(
    "/admin/events",
    "POST",
    { ...event, meetingUrl: "https://zoom.us.evil.test" },
    400,
  );
  await admin.json(
    "/admin/events",
    "POST",
    { ...event, endsAt: "2026-11-01T00:30:00Z" },
    400,
  );
  eventId = (await admin.json("/admin/events", "POST", event, 201)).id;
  await participant.json(
    "/events/lingkungan-lb3/register",
    "POST",
    { wantsCertificate: true, consent: true },
    409,
  );
  const results = await Promise.all([
    participant.request(`/events/${eventId}/register`, "POST", {
      wantsCertificate: true,
      consent: true,
      userId: "forged",
    }),
    other.request(`/events/${eventId}/register`, "POST", {
      wantsCertificate: true,
      consent: true,
    }),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  const winnerIndex = results.findIndex((r) => r.status === 201);
  registrationId = (await results[winnerIndex].json()).id;
  // Keep later ownership assertions deterministic regardless of network scheduling.
  if (winnerIndex === 1)
    db.prepare("UPDATE registrations SET user_id=? WHERE id=?").run(
      (await participant.json("/session")).user.id,
      registrationId,
    );
  await participant.json(
    `/events/${eventId}/register`,
    "POST",
    { wantsCertificate: true, consent: true },
    409,
  );
  await other.json(
    `/registrations/${registrationId}/meeting`,
    "GET",
    undefined,
    404,
  );
  await other.json(
    `/registrations/${registrationId}/check-out`,
    "POST",
    {},
    404,
  );
  assert.equal((await other.json("/me")).registrations.length, 0);
});

test("meeting and attendance respect time windows; certificates require approved attendance and evaluation", async () => {
  await participant.json(
    `/registrations/${registrationId}/meeting`,
    "GET",
    undefined,
    409,
  );
  await participant.json(
    `/registrations/${registrationId}/check-in`,
    "POST",
    { code: event.attendanceCode },
    409,
  );
  await admin.json(
    `/admin/registrations/${registrationId}/certificate`,
    "POST",
    {},
    409,
  );
  currentTime = Date.parse(event.startsAt);
  assert.equal(
    (await participant.json(`/registrations/${registrationId}/meeting`)).url,
    event.meetingUrl,
  );
  await participant.json(
    `/registrations/${registrationId}/check-in`,
    "POST",
    { code: "wrong-code" },
    400,
  );
  await participant.json(`/registrations/${registrationId}/check-in`, "POST", {
    code: event.attendanceCode,
  });
  await participant.json(
    `/registrations/${registrationId}/check-in`,
    "POST",
    { code: event.attendanceCode },
    409,
  );
  await participant.json(
    `/registrations/${registrationId}/evaluation`,
    "POST",
    { rating: 5, learning: "Pengalaman pembelajaran yang baik." },
    409,
  );
  currentTime = Date.parse(event.endsAt);
  await participant.json(
    `/registrations/${registrationId}/check-out`,
    "POST",
    {},
  );
  await participant.json(
    `/registrations/${registrationId}/check-out`,
    "POST",
    {},
    409,
  );
  await admin.json(`/admin/registrations/${registrationId}/approve`, "POST", {
    reason: "Kehadiran telah diperiksa dalam pengujian lokal.",
  });
  await admin.json(
    `/admin/registrations/${registrationId}/certificate`,
    "POST",
    {},
    409,
  );
  await participant.json(
    `/registrations/${registrationId}/evaluation`,
    "POST",
    { rating: 6, learning: "Teks lengkap tetapi rating salah." },
    400,
  );
  await participant.json(
    `/registrations/${registrationId}/evaluation`,
    "POST",
    { rating: 5, learning: "Pengalaman pembelajaran yang baik." },
  );
  const issued = await admin.json(
    `/admin/registrations/${registrationId}/certificate`,
    "POST",
    {},
    201,
  );
  certificateToken = issued.token;
  assert.match(certificateToken, /^[a-f0-9]{64}$/);
  assert.equal(
    (
      await admin.json(
        `/admin/registrations/${registrationId}/certificate`,
        "POST",
        {},
      )
    ).token,
    certificateToken,
  );
});

test("public verification protects personal details; PDF requires ownership; revocation is auditable", async () => {
  const publicRecord = (
    await anonymous.json(`/certificates/${certificateToken}`)
  ).certificate;
  assert.equal(publicRecord.recipient, "Alya T. P.");
  assert.equal(publicRecord.status, "valid");
  assert.ok(!("email" in publicRecord) && !("organization" in publicRecord));
  await anonymous.json(
    `/certificates/${certificateToken}/pdf`,
    "GET",
    undefined,
    401,
  );
  await other.json(
    `/certificates/${certificateToken}/pdf`,
    "GET",
    undefined,
    404,
  );
  const pdf = await participant.request(
    `/certificates/${certificateToken}/pdf`,
  );
  assert.equal(pdf.status, 200);
  assert.equal(pdf.headers.get("content-type"), "application/pdf");
  const bytes = Buffer.from(await pdf.arrayBuffer());
  assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
  assert.ok(bytes.length > 2000);
  await participant.json(
    `/admin/certificates/${certificateToken}/revoke`,
    "POST",
    { reason: "Permintaan tanpa akses pengelola." },
    403,
  );
  await admin.json(`/admin/certificates/${certificateToken}/revoke`, "POST", {
    reason: "Pencabutan dokumen khusus pengujian lokal.",
  });
  assert.equal(
    (await anonymous.json(`/certificates/${certificateToken}`)).certificate
      .status,
    "revoked",
  );
  await participant.json(
    `/certificates/${certificateToken}/pdf`,
    "GET",
    undefined,
    409,
  );
  assert.ok(
    Number(
      db.prepare("SELECT COUNT(*) AS count FROM audit_log").get()!.count,
    ) >= 4,
  );
});

test("paid certificates cannot be issued without an implemented payment flow", async () => {
  currentTime = Date.parse("2026-11-01T00:00:00Z");
  const paidId = (
    await admin.json(
      "/admin/events",
      "POST",
      {
        ...event,
        title: "Webinar Sertifikat Berbayar Pengujian",
        certificate: "paid",
        certificateFee: 15000,
      },
      201,
    )
  ).id;
  const paidRegistration = (
    await participant.json(
      `/events/${paidId}/register`,
      "POST",
      { consent: true, wantsCertificate: true },
      201,
    )
  ).id;
  db.prepare("UPDATE registrations SET attendance_approved=1 WHERE id=?").run(
    paidRegistration,
  );
  db.prepare("INSERT INTO evaluations VALUES (?,?,?,?)").run(
    paidRegistration,
    5,
    "Fixture evaluasi pengujian",
    new Date(currentTime).toISOString(),
  );
  await admin.json(
    `/admin/registrations/${paidRegistration}/certificate`,
    "POST",
    {},
    409,
  );
});

test("logout invalidates the former session; failed login is generic; oversized requests are refused", async () => {
  const oldCookie = participant.cookie;
  await participant.json("/auth/logout", "POST", {});
  const replay = new Client();
  replay.cookie = oldCookie;
  await replay.json("/me", "GET", undefined, 401);
  await participant.json(
    "/auth/login",
    "POST",
    { email: "participant@example.test", password: "Incorrect-password!2026" },
    401,
  );
  await participant.json("/auth/login", "POST", {
    email: "participant@example.test",
    password: "Long-test-password!2026",
  });
  await participant.json(
    "/profile",
    "PUT",
    { name: "x".repeat(17000), organization: "" },
    413,
  );
});

test("repeated failed login requests are rate-limited with retry guidance", async () => {
  let limited: Response | undefined;
  for (let i = 0; i < 13; i++) {
    const result = await anonymous.request("/auth/login", "POST", {
      email: "missing@example.test",
      password: "Incorrect-password!2026",
    });
    if (result.status === 429) {
      limited = result;
      break;
    }
    assert.equal(result.status, 401);
  }
  assert.ok(limited);
  assert.ok(Number(limited.headers.get("retry-after")) > 0);
});
test("expired sessions lose access and are replaced with an anonymous session", async () => {
  currentTime += 9 * 3600000;
  await participant.json("/me", "GET", undefined, 401);
  assert.equal((await participant.json("/session")).user, null);
});

test("production session cookie and CSP enforce HTTPS and exclude inline scripts", async () => {
  const prod = createApplication({
    databasePath: ":memory:",
    appUrl: "https://nexivo.test",
    production: true,
  });
  const instance = prod.app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => instance.once("listening", resolve));
  try {
    const address = instance.address();
    assert.ok(address && typeof address !== "string");
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/session`,
    );
    const cookie = response.headers.get("set-cookie")!;
    assert.match(cookie, /^__Host-nexivo=/);
    assert.match(cookie, /; Secure/);
    assert.match(cookie, /HttpOnly/);
    assert.match(
      response.headers.get("strict-transport-security")!,
      /max-age=/,
    );
    assert.match(
      response.headers.get("content-security-policy")!,
      /script-src 'self';/,
    );
  } finally {
    await new Promise<void>((resolve) => instance.close(() => resolve()));
    prod.db.close();
  }
});
