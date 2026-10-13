import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Plus,
  ShieldCheck,
  Users,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { api, body, errorMessage } from "./api";
import { categories, formatDate, Modal, SectionTitle } from "./components";
import type { Webinar } from "./types";

type AdminRegistration = {
  id: string;
  eventId: string;
  title: string;
  name: string;
  email: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  approved: number;
  evaluated: number;
  wantsCertificate: number;
  token: string | null;
  certificateStatus: string | null;
};
type Overview = {
  events: Webinar[];
  registrations: AdminRegistration[];
  interestCount: number;
  interests: {
    id: string;
    name: string;
    email: string;
    category: string;
    createdAt: string;
  }[];
};
export default function Admin({
  notify,
  refreshEvents,
  view = "overview",
}: {
  notify: (message: string) => void;
  refreshEvents: () => Promise<void>;
  view?: "overview" | "webinar" | "peserta" | "minat";
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<{
    id: string;
    type: "approve" | "revoke";
  } | null>(null);
  const load = useCallback(async () => {
    try {
      setData(await api<Overview>("/admin/overview"));
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api("/admin/events", {
        method: "POST",
        body: body({
          title: form.get("title"),
          category: form.get("category"),
          summary: form.get("summary"),
          description: form.get("description"),
          outcomes: String(form.get("outcomes"))
            .split("\n")
            .map((v) => v.trim())
            .filter(Boolean),
          status: form.get("status"),
          startsAt: new Date(
            String(form.get("startsAt")) + "+07:00",
          ).toISOString(),
          endsAt: new Date(String(form.get("endsAt")) + "+07:00").toISOString(),
          speaker: form.get("speaker"),
          capacity: Number(form.get("capacity")),
          meetingUrl: form.get("meetingUrl"),
          attendanceCode: form.get("attendanceCode"),
          certificate: form.get("certificate"),
          certificateFee: Number(form.get("certificateFee")),
          minimumAttendance: Number(form.get("minimumAttendance")),
        }),
      });
      setAdding(false);
      await load();
      await refreshEvents();
      notify("Webinar berhasil disimpan.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function issue(id: string) {
    setBusy(true);
    try {
      await api("/admin/registrations/" + id + "/certificate", {
        method: "POST",
        body: "{}",
      });
      await load();
      notify("Sertifikat diterbitkan.");
    } catch (err) {
      notify(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await api(
        action.type === "approve"
          ? "/admin/registrations/" + action.id + "/approve"
          : "/admin/certificates/" + action.id + "/revoke",
        { method: "POST", body: body({ reason: form.get("reason") }) },
      );
      setAction(null);
      await load();
      notify("Perubahan tersimpan dalam riwayat audit.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-intro">
        <div>
          <span className="eyebrow">PENGELOLA NEXIVO</span>
          <h1>
            {
              {
                overview: "Ringkasan pengelolaan",
                webinar: "Kelola webinar",
                peserta: "Peserta & sertifikat",
                minat: "Minat program",
              }[view]
            }
          </h1>
          <p>
            Jadwal nyata, peserta terdaftar, dan sertifikat yang dapat
            ditelusuri.
          </p>
        </div>
        {(view === "overview" || view === "webinar") && (
          <button
            className="button primary"
            onClick={() => {
              setAdding(true);
              setError("");
            }}
          >
            <Plus size={17} />
            Buat webinar
          </button>
        )}
      </div>
      {error && !adding && !action && (
        <p className="form-error" role="alert">
          {error}
          <button onClick={() => void load()}>Coba lagi</button>
        </p>
      )}
      {!data ? (
        !error && <p role="status">Memuat dashboard pengelola…</p>
      ) : (
        <>
          <div className="admin-stats">
            <article className="panel">
              <CalendarDays />
              <strong>
                {data.events.filter((e) => e.status === "published").length}
              </strong>
              <span>Webinar dipublikasikan</span>
            </article>
            <article className="panel">
              <Users />
              <strong>{data.registrations.length}</strong>
              <span>Pendaftaran terbaru (maks. 200)</span>
            </article>
            <article className="panel">
              <ShieldCheck />
              <strong>{data.interestCount}</strong>
              <span>Minat program tercatat</span>
            </article>
          </div>
          {(view === "overview" || view === "webinar") && (
            <section className="panel">
              <SectionTitle title="Program & webinar" />
              <div
                className="table-scroll"
                role="region"
                aria-label="Tabel program dan webinar"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Program</th>
                      <th>Status</th>
                      <th>Jadwal</th>
                      <th>Peserta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.events.map((e) => (
                      <tr key={e.id}>
                        <td>{e.title}</td>
                        <td>
                          {e.status === "planned"
                            ? "Rencana"
                            : e.status === "published"
                              ? "Dipublikasikan"
                              : "Selesai"}
                        </td>
                        <td>
                          {e.startsAt
                            ? formatDate(e.startsAt, true)
                            : "Belum ditentukan"}
                        </td>
                        <td>
                          {e.registered} / {e.capacity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {(view === "overview" || view === "peserta") && (
            <section className="panel admin-participants">
              <SectionTitle
                title="Peserta & validasi"
                subtitle="Verifikasi kehadiran dengan catatan platform webinar sebelum menyetujui."
              />
              {!data.registrations.length ? (
                <p className="muted">Belum ada peserta terdaftar.</p>
              ) : (
                data.registrations.map((r) => (
                  <article className="participant-row" key={r.id}>
                    <div>
                      <strong>{r.name}</strong>
                      <span>{r.title}</span>
                      <small>{r.email}</small>
                      <small>
                        Absensi:{" "}
                        {r.checkedOutAt
                          ? "Masuk & keluar"
                          : r.checkedInAt
                            ? "Masuk"
                            : "Belum ada"}{" "}
                        · Evaluasi: {r.evaluated ? "Selesai" : "Belum selesai"}
                      </small>
                    </div>
                    <div className="row-actions">
                      {r.approved ? (
                        <span className="status-pill">Kehadiran valid</span>
                      ) : (
                        <button
                          className="button secondary small"
                          disabled={!r.checkedOutAt || busy}
                          onClick={() => {
                            setAction({ id: r.id, type: "approve" });
                            setError("");
                          }}
                        >
                          Validasi
                        </button>
                      )}
                      {r.token ? (
                        <>
                          <a
                            href={"#verifikasi/" + r.token}
                            className="text-link"
                          >
                            {r.certificateStatus === "revoked"
                              ? "Dicabut"
                              : "Lihat sertifikat"}
                          </a>
                          {r.certificateStatus === "valid" && (
                            <button
                              className="button secondary small"
                              onClick={() => {
                                setAction({ id: r.token!, type: "revoke" });
                                setError("");
                              }}
                            >
                              Cabut
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          className="button primary small"
                          disabled={
                            !r.approved ||
                            !r.evaluated ||
                            !r.wantsCertificate ||
                            busy
                          }
                          onClick={() => void issue(r.id)}
                        >
                          Terbitkan sertifikat
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          )}
        </>
      )}
      {data && (view === "overview" || view === "minat") && (
        <section className="panel admin-participants">
          <SectionTitle
            title="Minat program"
            subtitle="Pendaftar minat terbaru (maks. 200). Informasi ini hanya tersedia untuk pengelola; pengiriman email belum otomatis."
          />
          {data.interests.length ? (
            <div
              className="table-scroll"
              role="region"
              aria-label="Tabel minat program"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Bidang</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.interests.map((i) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td>{i.email}</td>
                      <td>{i.category}</td>
                      <td>{formatDate(i.createdAt, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">Belum ada minat program yang tercatat.</p>
          )}
        </section>
      )}
      {adding && (
        <Modal title="Buat webinar" wide onClose={() => setAdding(false)}>
          <form className="form-stack" onSubmit={create}>
            <p className="muted">
              Masukkan jadwal dan narasumber yang telah dikonfirmasi. Seluruh
              waktu dalam WIB.
            </p>
            <label>
              Judul
              <input name="title" required minLength={10} maxLength={150} />
            </label>
            <div className="form-columns">
              <label>
                Bidang
                <select name="category">
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select name="status">
                  <option value="planned">Rencana</option>
                  <option value="published">Publikasikan</option>
                </select>
              </label>
            </div>
            <label>
              Ringkasan
              <input name="summary" required minLength={20} maxLength={240} />
            </label>
            <label>
              Deskripsi
              <textarea
                name="description"
                required
                minLength={40}
                maxLength={3000}
                rows={3}
              />
            </label>
            <label>
              Hasil belajar (satu per baris)
              <textarea name="outcomes" required rows={3} />
            </label>
            <div className="form-columns">
              <label>
                Mulai (WIB)
                <input name="startsAt" type="datetime-local" required />
              </label>
              <label>
                Selesai (WIB)
                <input name="endsAt" type="datetime-local" required />
              </label>
            </div>
            <div className="form-columns">
              <label>
                Narasumber
                <input name="speaker" required minLength={2} />
              </label>
              <label>
                Kuota
                <input
                  name="capacity"
                  type="number"
                  min={1}
                  max={10000}
                  defaultValue={100}
                  required
                />
              </label>
            </div>
            <label>
              Tautan Zoom / Google Meet
              <input
                name="meetingUrl"
                type="url"
                required
                placeholder="https://meet.google.com/…"
              />
            </label>
            <label>
              Kode kehadiran
              <input
                name="attendanceCode"
                required
                minLength={6}
                maxLength={64}
                autoComplete="off"
              />
            </label>
            <div className="form-columns">
              <label>
                Sertifikat
                <select name="certificate">
                  <option value="free">Gratis</option>
                  <option value="paid">
                    Berbayar (penerbitan belum aktif)
                  </option>
                  <option value="none">Tanpa sertifikat</option>
                </select>
              </label>
              <label>
                Biaya sertifikat (Rp)
                <input
                  name="certificateFee"
                  type="number"
                  min={0}
                  defaultValue={0}
                />
              </label>
            </div>
            <label>
              Minimum kehadiran (%)
              <input
                name="minimumAttendance"
                type="number"
                required
                min={1}
                max={100}
                defaultValue={80}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              {busy ? "Menyimpan…" : "Simpan webinar"}
              <ArrowRight size={17} />
            </button>
          </form>
        </Modal>
      )}
      {action && (
        <Modal
          title={
            action.type === "approve"
              ? "Validasi kehadiran"
              : "Cabut sertifikat"
          }
          onClose={() => setAction(null)}
        >
          <form className="form-stack" onSubmit={confirm}>
            <p className="muted">
              Tindakan ini dicatat bersama identitas pengelola dan waktunya.
            </p>
            <label>
              Alasan / bukti verifikasi
              <textarea
                name="reason"
                required
                minLength={10}
                maxLength={500}
                rows={4}
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary" disabled={busy}>
              Konfirmasi
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
