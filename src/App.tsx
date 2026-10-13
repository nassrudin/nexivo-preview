import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  X,
  BookOpen,
  Bookmark,
  Award,
  ChevronRight,
  CalendarDays,
  Clock3,
  ShieldCheck,
  LogOut,
  UserRound,
  Check,
  CircleHelp,
  Download,
  ExternalLink,
  Mail,
  MoveUpRight,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import { api, body, errorMessage, setCsrf } from "./api";
import {
  categories,
  CategoryIcon,
  categoryClasses,
  formatDate,
  formatTime,
  Modal,
  ProgramArt,
  ProgramCard,
  SectionTitle,
  StateCard,
} from "./components";
import type { Certificate, Registration, User, Webinar } from "./types";
import AuthForm from "./AuthForm";
import Admin from "./Admin";
import Dashboard from "./Dashboard";
import { isDesignPreview } from "./config";
import PublicLayout from "./layouts/PublicLayout";
import WorkspaceLayout from "./layouts/WorkspaceLayout";
import PublicHome from "./public/PublicHome";

type DialogState =
  | { type: "auth" | "interest" | "search" | "profile" | "updates" }
  | { type: "detail" | "register"; event: Webinar }
  | { type: "attendance" | "evaluation"; registration: Registration }
  | { type: "meeting"; url: string }
  | null;
const pageTitles: Record<string, string> = {
  beranda: "Beranda",
  program: "Webinar",
  dashboard: "Dashboard peserta",
  belajarku: "Belajar saya",
  sertifikat: "Sertifikat saya",
  tentang: "Tentang NEXIVO",
  privasi: "Penggunaan data",
  verifikasi: "Verifikasi sertifikat",
  admin: "Dashboard pengelola",
  "admin/webinar": "Kelola webinar",
  "admin/peserta": "Peserta & sertifikat",
  "admin/minat": "Minat program",
};
const descriptions: Record<string, [string, string, string]> = {
  program: [
    "TEMUKAN PERSPEKTIF BARU",
    "Pengetahuan untuk langkah berikutnya.",
    "Jelajahi bidang yang ingin kamu pelajari. Jadwal program diumumkan setelah dikonfirmasi.",
  ],
  belajarku: [
    "PERJALANAN BELAJARMU",
    "Satu tempat untuk terus bertumbuh.",
    "Kelola program tersimpan, pendaftaran, dan aktivitas webinarmu.",
  ],
  sertifikat: [
    "NEXIVO CERT",
    "Partisipasi yang dapat ditelusuri.",
    "Kelola sertifikatmu atau periksa keaslian dokumen melalui kode verifikasi.",
  ],
  verifikasi: [
    "VERIFIKASI DOKUMEN",
    "Periksa keaslian sertifikat.",
    "Gunakan kode unik atau tautan pada QR sertifikat untuk melihat status dokumen partisipasi NEXIVO.",
  ],
};
const getRoute = () => window.location.hash.slice(1) || "beranda";
export default function App() {
  const [route, setRoute] = useState(getRoute);
  const previousRoute = useRef(route);
  useEffect(() => {
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [route]);
  const [user, setUser] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [events, setEvents] = useState<Webinar[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("nexivo-theme") || "light";
    } catch {
      return "light";
    }
  });
  const [filter, setFilter] = useState("Semua bidang");
  const [query, setQuery] = useState("");
  const pendingCategory = useRef<string | null>(null);
  const [savedTab, setSavedTab] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [interestDone, setInterestDone] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [verifyBusy, setVerifyBusy] = useState(false);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 5500);
  }, []);
  const refreshEvents = useCallback(async () => {
    const result = await api<{ events: Webinar[] }>("/events");
    setEvents(result.events);
  }, []);
  const refreshPersonal = useCallback(async () => {
    const result = await api<{
      bookmarks: string[];
      registrations: Registration[];
    }>("/me");
    setBookmarks(result.bookmarks);
    setRegistrations(result.registrations);
  }, []);
  const load = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [session, programs] = await Promise.all([
          api<{ user: User | null; csrf: string }>("/session", { signal }),
          api<{ events: Webinar[] }>("/events", { signal }),
        ]);
        if (signal?.aborted) return;
        setCsrf(session.csrf);
        setUser(session.user);
        setEvents(programs.events);
        setLoadError("");
        if (session.user) await refreshPersonal();
      } catch (err) {
        if (!signal?.aborted) setLoadError(errorMessage(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [refreshPersonal],
  );
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    const listener = () => {
      setRoute(getRoute());
      setDialog(null);
      setQuery("");
      setFilter(pendingCategory.current || "Semua bidang");
      pendingCategory.current = null;
      window.scrollTo({ top: 0, behavior: "instant" });
      document.getElementById("main")?.focus({ preventScroll: true });
    };
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("nexivo-theme", theme);
    } catch {
      /* Preference storage is optional. */
    }
  }, [theme]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        setDialog({ type: "search" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  useEffect(() => {
    document.title = `${route.startsWith("verifikasi") ? "Verifikasi sertifikat" : pageTitles[route] || "NEXIVO"} · NEXIVO`;
  }, [route]);
  const verify = useCallback(async (token: string) => {
    setVerifyBusy(true);
    setVerifyError("");
    setCertificate(null);
    try {
      const result = await api<{ certificate: Certificate }>(
        "/certificates/" + encodeURIComponent(token),
      );
      setCertificate(result.certificate);
    } catch (err) {
      setVerifyError(errorMessage(err));
    } finally {
      setVerifyBusy(false);
    }
  }, []);
  useEffect(() => {
    if (route.startsWith("verifikasi/"))
      void verify(route.slice("verifikasi/".length));
  }, [route, verify]);
  function open(next: DialogState) {
    if (next?.type === "search") setFilter("Semua bidang");
    setFormError("");
    setInterestDone(false);
    setDialog(next);
  }
  async function save(event: Webinar) {
    if (!user) {
      open({ type: "auth" });
      return;
    }
    const saved = !bookmarks.includes(event.id);
    try {
      await api("/bookmarks/" + event.id, {
        method: "PUT",
        body: body({ saved }),
      });
      await refreshPersonal();
      notify(
        saved
          ? "Program tersimpan di Belajarku."
          : "Program dihapus dari simpanan.",
      );
    } catch (err) {
      notify(errorMessage(err));
    }
  }
  async function submitForm(
    event: FormEvent<HTMLFormElement>,
    action: (data: FormData) => Promise<void>,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setFormError("");
    try {
      await action(form);
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const visibleEvents = events.filter(
    (event) =>
      (filter === "Semua bidang" || event.category === filter) &&
      [event.title, event.category, event.summary, event.speaker || ""]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const latest = events.find(
    (e) =>
      e.status === "published" &&
      !!e.endsAt &&
      Date.parse(e.endsAt) > currentTime,
  );
  const selected = dialog?.type === "detail" ? dialog.event : null;
  const alreadyRegistered =
    !!selected && registrations.some((r) => r.eventId === selected.id);
  const registrationClosed =
    !!selected &&
    selected.status !== "planned" &&
    (selected.status === "completed" ||
      !!(selected.startsAt && Date.parse(selected.startsAt) <= currentTime) ||
      selected.registered >= selected.capacity);
  const renderPrograms = (items: Webinar[]) => (
    <div className="program-grid">
      {items.map((event) => (
        <ProgramCard
          key={event.id}
          event={event}
          currentTime={currentTime}
          saved={bookmarks.includes(event.id)}
          onOpen={() => open({ type: "detail", event })}
          onSave={() => void save(event)}
        />
      ))}
    </div>
  );
  const verificationContent = (
    <>
      <form
        className="verify-form"
        onSubmit={(event) => {
          event.preventDefault();
          const raw = String(
            new FormData(event.currentTarget).get("token"),
          ).trim();
          const token = raw.includes("#verifikasi/")
            ? raw.split("#verifikasi/")[1]
            : raw;
          void verify(token);
        }}
      >
        <label htmlFor="certificate-token">
          Kode atau tautan verifikasi sertifikat
        </label>
        <div>
          <input
            id="certificate-token"
            name="token"
            required
            maxLength={300}
            placeholder="Masukkan kode dari QR sertifikat"
            autoComplete="off"
          />
          <button className="button primary" disabled={verifyBusy}>
            {verifyBusy ? "Memeriksa…" : "Verifikasi"}
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
      {verifyError && (
        <p className="form-error" role="alert">
          {verifyError}
        </p>
      )}
      {certificate && (
        <article
          className={`verified-certificate ${certificate.status === "revoked" ? "revoked" : ""}`}
        >
          <ShieldCheck size={34} />
          <span className="status-pill">
            {certificate.status === "valid"
              ? "Dokumen valid"
              : "Dokumen dicabut"}
          </span>
          <h2>{certificate.type}</h2>
          <dl>
            <div>
              <dt>Nomor</dt>
              <dd>{certificate.number}</dd>
            </div>
            <div>
              <dt>Penerima</dt>
              <dd>{certificate.recipient}</dd>
            </div>
            <div>
              <dt>Webinar</dt>
              <dd>{certificate.event}</dd>
            </div>
            <div>
              <dt>Tanggal</dt>
              <dd>{formatDate(certificate.date, true)}</dd>
            </div>
            <div>
              <dt>Penerbit</dt>
              <dd>NEXIVO</dd>
            </div>
          </dl>
          <p>
            Verifikasi menunjukkan status dokumen partisipasi di NEXIVO. Dokumen
            ini bukan sertifikat kompetensi atau bukti akreditasi.
          </p>
        </article>
      )}
    </>
  );

  const isWorkspace = [
    "dashboard",
    "belajarku",
    "sertifikat",
    "admin",
    "admin/webinar",
    "admin/peserta",
    "admin/minat",
  ].includes(route);
  const Layout = isWorkspace ? WorkspaceLayout : PublicLayout;
  async function logout() {
    try {
      const result = await api<{ csrf: string }>("/auth/logout", {
        method: "POST",
        body: "{}",
      });
      setCsrf(result.csrf);
      setUser(null);
      setBookmarks([]);
      setRegistrations([]);
      setDialog(null);
      window.location.hash = "beranda";
      notify("Kamu sudah keluar dari akun.");
    } catch (error) {
      notify(errorMessage(error));
    }
  }

  return (
    <>
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus({ preventScroll: true });
        }}
      >
        Lewati ke konten
      </a>
      <Layout
        route={route}
        user={user}
        theme={theme}
        preview={isDesignPreview}
        onTheme={() => setTheme(theme === "light" ? "dark" : "light")}
        onAuth={() => open({ type: "auth" })}
        onSearch={() => open({ type: "search" })}
        onUpdates={() => open({ type: "updates" })}
        onProfile={() => open({ type: "profile" })}
        onLogout={() => void logout()}
      >
        <main id="main" tabIndex={-1}>
          {loading ? (
            <div className="loading-page">
              <LoaderCircle className="spin" />
              <h1>Menyiapkan ruang belajarmu…</h1>
            </div>
          ) : loadError ? (
            <StateCard
              title="Ruang belajar belum dapat dimuat"
              headingLevel={1}
              action={
                <button
                  className="button primary"
                  onClick={() => {
                    setLoading(true);
                    void load();
                  }}
                >
                  Coba lagi
                </button>
              }
            >
              {loadError}
            </StateCard>
          ) : (
            <>
              {route === "beranda" && (
                <PublicHome
                  events={events}
                  currentTime={currentTime}
                  bookmarks={bookmarks}
                  onDetail={(event) => open({ type: "detail", event })}
                  onSave={(event) => void save(event)}
                  onInterest={() => open({ type: "interest" })}
                  onCategory={(category) => {
                    pendingCategory.current = category;
                    window.location.hash = "program";
                  }}
                />
              )}
              {route === "dashboard" &&
                (user || isDesignPreview ? (
                  <Dashboard
                    user={user}
                    events={events}
                    currentTime={currentTime}
                    bookmarks={bookmarks.length}
                    registrations={registrations.length}
                    renderPrograms={renderPrograms}
                    onInterest={() => open({ type: "interest" })}
                    onAuth={() => open({ type: "auth" })}
                    onDetail={(event) => open({ type: "detail", event })}
                  />
                ) : (
                  <StateCard
                    title="Masuk ke dashboard peserta"
                    headingLevel={1}
                    action={
                      <button
                        className="button primary"
                        onClick={() => open({ type: "auth" })}
                      >
                        Masuk / buat akun <ArrowRight size={16} />
                      </button>
                    }
                    icon={<BookOpen size={28} />}
                  >
                    Simpan topik, kelola pendaftaran, dan lanjutkan perjalanan
                    belajarmu di satu tempat.
                  </StateCard>
                ))}
              {route === "program" && (
                <>
                  <PageIntro content={descriptions.program} />
                  <section className="catalog-toolbar">
                    <label className="catalog-search">
                      <Search size={18} />
                      <input
                        type="search"
                        aria-label="Cari di katalog program"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cari topik, bidang, atau narasumber…"
                      />
                    </label>
                    <span>{visibleEvents.length} program eksplorasi</span>
                  </section>
                  <div
                    className="category-filters"
                    role="group"
                    aria-label="Filter bidang"
                  >
                    {["Semua bidang", ...categories].map((c) => (
                      <button
                        key={c}
                        className={filter === c ? "active" : ""}
                        aria-pressed={filter === c}
                        onClick={() => setFilter(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  {visibleEvents.length ? (
                    renderPrograms(visibleEvents)
                  ) : (
                    <StateCard
                      title="Belum menemukan yang kamu cari"
                      action={
                        <button
                          className="button secondary"
                          onClick={() => {
                            setQuery("");
                            setFilter("Semua bidang");
                          }}
                        >
                          Reset pencarian
                        </button>
                      }
                      icon={<Search size={28} />}
                    >
                      Coba kata kunci lain atau jelajahi semua bidang.
                    </StateCard>
                  )}
                  <div className="catalog-note">
                    <Clock3 size={17} />
                    <p>
                      Program dalam persiapan merupakan arah topik NEXIVO.
                      Jadwal, narasumber, dan ketentuan final akan diumumkan
                      sebelum pendaftaran dibuka.
                    </p>
                    <button
                      className="text-link"
                      onClick={() => open({ type: "interest" })}
                    >
                      Catat minat saya
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </>
              )}
              {route === "belajarku" && (
                <>
                  <PageIntro content={descriptions.belajarku} />
                  {!user ? (
                    <StateCard
                      title="Ruang belajar ini menunggumu"
                      action={
                        <button
                          className="button primary"
                          onClick={() => open({ type: "auth" })}
                        >
                          Masuk / buat akun
                          <ArrowRight size={16} />
                        </button>
                      }
                    >
                      Masuk untuk melihat pendaftaran dan program yang kamu
                      simpan.
                    </StateCard>
                  ) : (
                    <>
                      <div className="personal-tabs">
                        <button
                          className={!savedTab ? "active" : ""}
                          onClick={() => setSavedTab(false)}
                        >
                          Webinar saya <span>{registrations.length}</span>
                        </button>
                        <button
                          className={savedTab ? "active" : ""}
                          onClick={() => setSavedTab(true)}
                        >
                          Program tersimpan <span>{bookmarks.length}</span>
                        </button>
                      </div>
                      {savedTab ? (
                        bookmarks.length ? (
                          renderPrograms(
                            events.filter((e) => bookmarks.includes(e.id)),
                          )
                        ) : (
                          <StateCard
                            title="Simpan ide untuk langkah berikutnya"
                            action={
                              <a className="button primary" href="#program">
                                Jelajahi program
                                <ArrowRight size={16} />
                              </a>
                            }
                          >
                            Tekan ikon bookmark pada program yang ingin kamu
                            ikuti.
                          </StateCard>
                        )
                      ) : registrations.length ? (
                        <div className="registration-list">
                          {registrations.map((r) => (
                            <article
                              className="panel registration-card"
                              key={r.id}
                            >
                              <div
                                className={
                                  "registration-art " +
                                  categoryClasses[r.category]
                                }
                              >
                                <CategoryIcon category={r.category} size={32} />
                              </div>
                              <div className="registration-copy">
                                <span className="eyebrow">{r.category}</span>
                                <h2>{r.title}</h2>
                                <p>
                                  {r.startsAt &&
                                    `${formatDate(r.startsAt, true)} · ${formatTime(r.startsAt)}`}
                                </p>
                                <div className="registration-status">
                                  <span>
                                    {r.checkedOutAt
                                      ? "Absensi selesai"
                                      : r.checkedInAt
                                        ? "Absensi masuk tercatat"
                                        : "Absensi belum tercatat"}
                                  </span>
                                  <span>
                                    {r.evaluated
                                      ? "Evaluasi selesai"
                                      : "Evaluasi belum selesai"}
                                  </span>
                                </div>
                              </div>
                              <div className="registration-actions">
                                <button
                                  className="button primary small"
                                  onClick={async () => {
                                    try {
                                      const result = await api<{
                                        url: string;
                                      }>("/registrations/" + r.id + "/meeting");
                                      open({
                                        type: "meeting",
                                        url: result.url,
                                      });
                                    } catch (err) {
                                      notify(errorMessage(err));
                                    }
                                  }}
                                >
                                  Ruang webinar
                                  <ExternalLink size={14} />
                                </button>
                                {!r.checkedInAt ? (
                                  <button
                                    className="button secondary small"
                                    onClick={() =>
                                      open({
                                        type: "attendance",
                                        registration: r,
                                      })
                                    }
                                  >
                                    Absensi masuk
                                  </button>
                                ) : !r.checkedOutAt ? (
                                  <button
                                    className="button secondary small"
                                    onClick={async () => {
                                      try {
                                        await api(
                                          "/registrations/" +
                                            r.id +
                                            "/check-out",
                                          { method: "POST", body: "{}" },
                                        );
                                        await refreshPersonal();
                                        notify("Absensi akhir tercatat.");
                                      } catch (err) {
                                        notify(errorMessage(err));
                                      }
                                    }}
                                  >
                                    Absensi akhir
                                  </button>
                                ) : (
                                  <button
                                    className="button secondary small"
                                    onClick={() =>
                                      open({
                                        type: "evaluation",
                                        registration: r,
                                      })
                                    }
                                  >
                                    {r.evaluated
                                      ? "Lihat / ubah evaluasi"
                                      : "Isi evaluasi"}
                                  </button>
                                )}
                                {r.certificateToken && (
                                  <a
                                    className="text-link"
                                    href={"#verifikasi/" + r.certificateToken}
                                  >
                                    Lihat sertifikat
                                    <ArrowUpRight size={14} />
                                  </a>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <StateCard
                          title="Bab pertamamu belum dimulai"
                          action={
                            <a className="button primary" href="#program">
                              Temukan program
                              <ArrowRight size={16} />
                            </a>
                          }
                          icon={<BookOpen size={28} />}
                        >
                          Setelah mendaftar webinar, jadwal, absensi, dan
                          evaluasinya akan tampil di sini.
                        </StateCard>
                      )}
                    </>
                  )}
                </>
              )}
              {(route === "sertifikat" ||
                route === "verifikasi" ||
                route.startsWith("verifikasi/")) && (
                <>
                  <PageIntro
                    content={
                      route === "sertifikat"
                        ? descriptions.sertifikat
                        : descriptions.verifikasi
                    }
                  />
                  <div className="certificate-layout">
                    <section className="panel verification-panel">
                      <SectionTitle
                        title="Verifikasi sertifikat"
                        subtitle="Gunakan kode unik atau tautan yang tercantum pada QR sertifikat."
                      />
                      {verificationContent}
                    </section>
                    <aside className="panel certificate-explainer">
                      <span className="certificate-seal">
                        <Award size={36} />
                      </span>
                      <h2>Lebih dari sebuah dokumen.</h2>
                      <p>
                        Sertifikat partisipasi diterbitkan setelah kehadiran dan
                        evaluasi memenuhi ketentuan webinar.
                      </p>
                      <ul>
                        <li>
                          <Check size={16} />
                          Nomor dokumen unik
                        </li>
                        <li>
                          <Check size={16} />
                          Status dapat diverifikasi
                        </li>
                        <li>
                          <Check size={16} />
                          Penerbitan dapat ditelusuri
                        </li>
                      </ul>
                      <span className="muted">
                        Bukan sertifikat kompetensi atau klaim akreditasi.
                      </span>
                    </aside>
                  </div>
                  {route === "sertifikat" && (
                    <section className="own-certificates">
                      <SectionTitle title="Sertifikat saya" />
                      {user && registrations.some((r) => r.certificateToken) ? (
                        registrations
                          .filter((r) => r.certificateToken)
                          .map((r) => (
                            <article
                              className="panel own-certificate"
                              key={r.id}
                            >
                              <Award size={27} />
                              <div>
                                <h3>{r.title}</h3>
                                <p>
                                  {r.certificateStatus === "revoked"
                                    ? "Sertifikat dicabut"
                                    : "Certificate of Participation"}
                                </p>
                              </div>
                              {r.certificateStatus === "valid" && (
                                <a
                                  className="button secondary"
                                  href={
                                    "/api/certificates/" +
                                    r.certificateToken +
                                    "/pdf"
                                  }
                                >
                                  <Download size={16} />
                                  Unduh PDF
                                </a>
                              )}
                            </article>
                          ))
                      ) : (
                        <StateCard
                          title={
                            user
                              ? "Setiap perjalanan punya pencapaian"
                              : "Simpan pencapaianmu di satu tempat"
                          }
                          action={
                            !user && (
                              <button
                                className="button secondary"
                                onClick={() => open({ type: "auth" })}
                              >
                                Masuk ke akun
                              </button>
                            )
                          }
                          icon={<Award size={28} />}
                        >
                          {user
                            ? "Sertifikat yang diterbitkan pengelola akan muncul di sini."
                            : "Masuk untuk melihat dan mengunduh sertifikat yang telah diterbitkan."}
                        </StateCard>
                      )}
                    </section>
                  )}
                </>
              )}
              {route === "tentang" && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">
                        NEXT GENERATION VIRTUAL LEARNING & KNOWLEDGE
                      </span>
                      <h1>Belajar memperluas kemungkinan.</h1>
                      <p>
                        NEXIVO mempertemukan rasa ingin tahu, pengalaman
                        praktisi, dan pembelajaran lintas bidang.
                      </p>
                    </div>
                  </div>
                  <section className="about-hero panel">
                    <div>
                      <span className="eyebrow">LEARN. CONNECT. GROW.</span>
                      <h2>
                        Dari berbagi pengetahuan,
                        <br />
                        menuju ekosistem pembelajaran.
                      </h2>
                      <p>
                        Dimulai dari webinar dan seminar online yang terbuka
                        bagi mahasiswa, pebisnis, akademisi, serta profesional.
                        NEXIVO dirancang untuk tumbuh menjadi ruang pengembangan
                        pengetahuan dan kolaborasi.
                      </p>
                      <button
                        className="button primary"
                        onClick={() => open({ type: "interest" })}
                      >
                        Ikut dalam perjalanan ini
                        <ArrowRight size={16} />
                      </button>
                    </div>
                    <span className="about-symbol" aria-hidden="true">
                      N<span>↗</span>
                    </span>
                  </section>
                  <div className="vision-grid">
                    {[
                      [
                        "01",
                        "Learn",
                        "Belajar dari perspektif baru melalui webinar, diskusi, dan pengembangan pengetahuan.",
                      ],
                      [
                        "02",
                        "Connect",
                        "Mempertemukan akademisi, praktisi, dan dunia usaha dalam percakapan yang bermakna.",
                      ],
                      [
                        "03",
                        "Grow",
                        "Membangun kebiasaan belajar berkelanjutan untuk pengembangan diri dan profesional.",
                      ],
                    ].map(([num, title, text]) => (
                      <article className="panel" key={num}>
                        <span className="eyebrow">{num}</span>
                        <h2>{title}.</h2>
                        <p>{text}</p>
                      </article>
                    ))}
                  </div>
                  <section className="panel roadmap">
                    <SectionTitle
                      title="Arah pengembangan NEXIVO"
                      subtitle="Visi bertahap, dengan kualitas pembelajaran sebagai fondasinya."
                    />
                    <ol>
                      <li>
                        <span>01</span>
                        <div>
                          <h3>Webinar & knowledge sharing</h3>
                          <p>
                            Fondasi awal: katalog, pendaftaran, kehadiran, dan
                            sertifikat partisipasi.
                          </p>
                        </div>
                        <small>Fokus awal</small>
                      </li>
                      <li>
                        <span>02</span>
                        <div>
                          <h3>Professional academy</h3>
                          <p>
                            Pengembangan program training dan workshop yang
                            lebih terstruktur.
                          </p>
                        </div>
                        <small>Rencana</small>
                      </li>
                      <li>
                        <span>03</span>
                        <div>
                          <h3>Corporate learning & advisory</h3>
                          <p>
                            Kolaborasi pembelajaran, kajian, dan pengembangan
                            profesional untuk organisasi.
                          </p>
                        </div>
                        <small>Rencana</small>
                      </li>
                    </ol>
                    <p className="status-note">
                      NEXIVO berada dalam tahap pengembangan. Status badan
                      hukum, akreditasi, mitra, serta layanan komersial akan
                      diumumkan setelah terkonfirmasi.
                    </p>
                  </section>
                  <Faq />
                </>
              )}
              {route === "privasi" && (
                <>
                  <div className="page-intro">
                    <div>
                      <span className="eyebrow">TRANSPARANSI DATA</span>
                      <h1>Data untuk mendukung perjalanan belajarmu.</h1>
                      <p>
                        Pemberitahuan penggunaan data pada versi pengembangan
                        NEXIVO.
                      </p>
                    </div>
                  </div>
                  <article className="panel prose">
                    <h2>Data yang dikumpulkan</h2>
                    <p>
                      Akun menyimpan nama, email, kata sandi dalam bentuk hash,
                      dan institusi bila diisi. Kegiatan menyimpan pendaftaran,
                      pilihan sertifikat, waktu absensi, evaluasi, serta riwayat
                      penerbitan sertifikat.
                    </p>
                    <h2>Tujuan penggunaan</h2>
                    <p>
                      Data digunakan untuk mengelola akun, administrasi webinar,
                      pencatatan minat program, serta penerbitan dan verifikasi
                      sertifikat. Formulir minat menyimpan pilihan bidang dan
                      persetujuan agar pengelola dapat menindaklanjuti saat
                      program tersedia.
                    </p>
                    <h2>Verifikasi publik</h2>
                    <p>
                      Halaman verifikasi hanya menampilkan nomor dokumen, nama
                      penerima yang disingkat, judul kegiatan, tanggal, dan
                      status. Email, nomor telepon, kata sandi, dan tautan ruang
                      webinar tidak ditampilkan.
                    </p>
                    <h2>Penyimpanan dan akses</h2>
                    <p>
                      Versi lokal menyimpan data pada server aplikasi. Peserta
                      hanya dapat mengakses data kegiatan miliknya; pengelola
                      memiliki akses administrasi yang diperlukan untuk
                      menjalankan kegiatan.
                    </p>
                    <h2>Sebelum layanan publik</h2>
                    <p>
                      Identitas pengelola data, kontak untuk permintaan akses
                      atau penghapusan, periode retensi, layanan email, dan
                      kebijakan operasional perlu ditetapkan sebelum menerima
                      data peserta nyata. Pemberitahuan ini merupakan dasar
                      untuk ditinjau pengelola sebelum peluncuran.
                    </p>
                  </article>
                </>
              )}
              {[
                "admin",
                "admin/webinar",
                "admin/peserta",
                "admin/minat",
              ].includes(route) &&
                (user?.role === "admin" ? (
                  <Admin
                    key={route}
                    view={
                      route === "admin/webinar"
                        ? "webinar"
                        : route === "admin/peserta"
                          ? "peserta"
                          : route === "admin/minat"
                            ? "minat"
                            : "overview"
                    }
                    notify={notify}
                    refreshEvents={refreshEvents}
                  />
                ) : (
                  <StateCard
                    title="Akses pengelola diperlukan"
                    headingLevel={1}
                    action={
                      !user && (
                        <button
                          className="button primary"
                          onClick={() => open({ type: "auth" })}
                        >
                          Masuk
                        </button>
                      )
                    }
                    icon={<ShieldCheck size={28} />}
                  >
                    Dashboard ini tersedia untuk akun pengelola yang telah
                    diberi akses.
                  </StateCard>
                ))}
              {![
                "beranda",
                "dashboard",
                "verifikasi",
                "admin/webinar",
                "admin/peserta",
                "admin/minat",
                "program",
                "belajarku",
                "sertifikat",
                "tentang",
                "privasi",
                "admin",
              ].includes(route) &&
                !route.startsWith("verifikasi/") && (
                  <StateCard
                    title="Halaman belum tersedia"
                    headingLevel={1}
                    action={
                      <a className="button primary" href="#beranda">
                        Kembali ke beranda
                      </a>
                    }
                  >
                    Pilih halaman melalui navigasi utama.
                  </StateCard>
                )}
            </>
          )}
        </main>
      </Layout>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={20} />
          <span>{toast}</span>
          <button
            className="icon-button"
            onClick={() => setToast("")}
            aria-label="Tutup pemberitahuan"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {dialog && (
        <Modal
          title={
            dialog.type === "auth"
              ? "Selamat datang di NEXIVO"
              : dialog.type === "detail"
                ? "Jelajahi program"
                : dialog.type === "register"
                  ? "Pendaftaran webinar"
                  : dialog.type === "interest"
                    ? "Jadilah yang pertama tahu"
                    : dialog.type === "search"
                      ? "Temukan pengetahuan berikutnya"
                      : dialog.type === "profile"
                        ? "Profil saya"
                        : dialog.type === "meeting"
                          ? "Ruang webinar siap"
                          : dialog.type === "attendance"
                            ? "Absensi masuk"
                            : dialog.type === "evaluation"
                              ? "Refleksi & evaluasi"
                              : "Informasi kegiatan"
          }
          wide={dialog.type === "detail"}
          onClose={() => setDialog(null)}
        >
          {dialog.type === "auth" &&
            (isDesignPreview ? (
              <PreviewNotice onClose={() => setDialog(null)} />
            ) : (
              <AuthForm
                onSuccess={async (loggedIn) => {
                  setUser(loggedIn);
                  setDialog(null);
                  await refreshPersonal();
                  if (
                    !isWorkspace ||
                    route === "dashboard" ||
                    (route.startsWith("admin") && loggedIn.role !== "admin")
                  )
                    window.location.hash =
                      loggedIn.role === "admin" ? "admin" : "dashboard";
                  notify(`Selamat datang, ${loggedIn.name.split(" ")[0]}.`);
                }}
              />
            ))}
          {dialog.type === "detail" && (
            <>
              <ProgramArt category={dialog.event.category} compact />
              <div className="detail-content">
                <span
                  className={`category-label ${categoryClasses[dialog.event.category]}`}
                >
                  <CategoryIcon category={dialog.event.category} size={15} />
                  {dialog.event.category}
                </span>
                <h3>{dialog.event.title}</h3>
                <p>{dialog.event.description}</p>
                <div className="detail-meta">
                  <span>
                    <CalendarDays size={17} />
                    {dialog.event.startsAt
                      ? `${formatDate(dialog.event.startsAt, true)} · ${formatTime(dialog.event.startsAt)}`
                      : "Jadwal belum diumumkan"}
                  </span>
                  <span>
                    <UserRound size={17} />
                    {dialog.event.speaker || "Narasumber akan dikonfirmasi"}
                  </span>
                  <span>
                    <Award size={17} />
                    {dialog.event.status === "planned"
                      ? "Ketentuan sertifikat akan diumumkan"
                      : dialog.event.certificate === "free"
                        ? "Sertifikat gratis, sesuai persyaratan"
                        : dialog.event.certificate === "paid"
                          ? `Sertifikat opsional Rp${dialog.event.certificateFee.toLocaleString("id-ID")} · pembayaran belum aktif`
                          : "Tanpa sertifikat"}
                  </span>
                </div>
                <h4>Perspektif yang akan kamu jelajahi</h4>
                <ul className="outcomes">
                  {dialog.event.outcomes.map((text) => (
                    <li key={text}>
                      <Check size={16} />
                      {text}
                    </li>
                  ))}
                </ul>
                {dialog.event.status === "planned" ? (
                  <div className="detail-notice">
                    <Clock3 size={19} />
                    <p>
                      Program sedang disiapkan. Ini adalah arah topik, bukan
                      pengumuman webinar yang sudah dijadwalkan.
                    </p>
                  </div>
                ) : (
                  <div className="detail-notice">
                    <ShieldCheck size={19} />
                    <p>
                      Webinar gratis. Sertifikat partisipasi opsional dengan
                      minimum kehadiran {dialog.event.minimumAttendance}% dan
                      evaluasi selesai.
                    </p>
                  </div>
                )}
                <div className="detail-actions">
                  <button
                    className="button primary"
                    onClick={() =>
                      alreadyRegistered
                        ? (setDialog(null),
                          (window.location.hash = "belajarku"))
                        : dialog.event.status === "planned"
                          ? open({ type: "interest" })
                          : user
                            ? open({ type: "register", event: dialog.event })
                            : open({ type: "auth" })
                    }
                    disabled={registrationClosed && !alreadyRegistered}
                  >
                    {alreadyRegistered
                      ? "Lihat di Belajarku"
                      : dialog.event.status === "planned"
                        ? "Kabari saat pendaftaran dibuka"
                        : registrationClosed
                          ? dialog.event.registered >= dialog.event.capacity
                            ? "Kuota penuh"
                            : "Pendaftaran ditutup"
                          : "Daftar webinar"}
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => void save(dialog.event)}
                  >
                    <Bookmark size={16} />
                    {bookmarks.includes(dialog.event.id)
                      ? "Tersimpan"
                      : "Simpan"}
                  </button>
                </div>
              </div>
            </>
          )}
          {dialog.type === "register" && (
            <form
              className="form-stack"
              onSubmit={(event) =>
                void submitForm(event, async (data) => {
                  await api("/events/" + dialog.event.id + "/register", {
                    method: "POST",
                    body: body({
                      consent: data.get("consent") === "on",
                      wantsCertificate: data.get("certificate") === "on",
                    }),
                  });
                  await refreshPersonal();
                  await refreshEvents();
                  setDialog(null);
                  window.location.hash = "belajarku";
                  notify("Pendaftaran berhasil. Sampai bertemu di webinar!");
                })
              }
            >
              <h3>{dialog.event.title}</h3>
              <p className="muted">
                {formatDate(dialog.event.startsAt!, true)} ·{" "}
                {formatTime(dialog.event.startsAt!)}
              </p>
              <div className="registration-identity">
                <strong>{user?.name}</strong>
                <span>{user?.email}</span>
              </div>
              {dialog.event.certificate !== "none" && (
                <label className="checkbox-label">
                  <input name="certificate" type="checkbox" />
                  <span>
                    Saya ingin sertifikat partisipasi.{" "}
                    {dialog.event.certificate === "free"
                      ? "Gratis jika memenuhi persyaratan."
                      : "Berbayar; pembayaran dan penerbitan belum aktif."}
                  </span>
                </label>
              )}
              <label className="checkbox-label">
                <input name="consent" type="checkbox" required />
                <span>
                  Saya memahami ketentuan kegiatan dan{" "}
                  <a href="#privasi">penggunaan data</a> untuk administrasi
                  webinar.
                </span>
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button className="button primary" disabled={busy}>
                {busy ? "Mendaftarkan…" : "Konfirmasi pendaftaran"}
                <ArrowRight size={16} />
              </button>
            </form>
          )}
          {dialog.type === "interest" &&
            (isDesignPreview ? (
              <PreviewNotice onClose={() => setDialog(null)} />
            ) : interestDone ? (
              <div className="interest-success" role="status">
                <CheckCircle2 size={46} />
                <h3>Minatmu sudah tercatat.</h3>
                <p>
                  Pengelola akan menindaklanjuti setelah jadwal program
                  tersedia. Terima kasih sudah menjadi bagian dari perjalanan
                  NEXIVO.
                </p>
                <button
                  className="button primary"
                  onClick={() => setDialog(null)}
                >
                  Kembali menjelajah
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              <form
                className="form-stack"
                onSubmit={(event) =>
                  void submitForm(event, async (data) => {
                    await api("/interests", {
                      method: "POST",
                      body: body({
                        name: data.get("name"),
                        email: data.get("email"),
                        category: data.get("category"),
                        consent: data.get("consent") === "on",
                      }),
                    });
                    setInterestDone(true);
                  })
                }
              >
                <p className="muted">
                  Tinggalkan minatmu agar pengelola dapat mengabari saat program
                  tersedia. Formulir ini bukan pendaftaran webinar.
                </p>
                <label>
                  Nama
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    defaultValue={user?.name}
                    placeholder="Nama lengkap"
                  />
                </label>
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    defaultValue={user?.email}
                    placeholder="nama@email.com"
                  />
                </label>
                <label>
                  Bidang yang diminati
                  <select name="category">
                    <option>Semua bidang</option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label className="checkbox-label">
                  <input name="consent" type="checkbox" required />
                  <span>
                    Saya bersedia menerima informasi program yang saya minati
                    dan memahami <a href="#privasi">penggunaan data</a>.
                  </span>
                </label>
                {formError && (
                  <p className="form-error" role="alert">
                    {formError}
                  </p>
                )}
                <button className="button primary" disabled={busy}>
                  {busy ? "Mencatat…" : "Catat minat saya"}
                  <Mail size={16} />
                </button>
              </form>
            ))}
          {dialog.type === "search" && (
            <div className="global-search">
              <label className="catalog-search">
                <Search size={19} />
                <input
                  autoFocus
                  aria-label="Cari program NEXIVO"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Topik, bidang, atau narasumber…"
                />
              </label>
              <div className="search-results">
                {visibleEvents.length ? (
                  visibleEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => open({ type: "detail", event })}
                    >
                      <span
                        className={
                          "search-category " + categoryClasses[event.category]
                        }
                      >
                        <CategoryIcon category={event.category} />
                      </span>
                      <span>
                        <strong>{event.title}</strong>
                        <small>
                          {event.category} ·{" "}
                          {event.status === "planned"
                            ? "Dalam persiapan"
                            : "Webinar"}
                        </small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))
                ) : (
                  <p className="muted">
                    Tidak ada hasil. Coba kata kunci lain.
                  </p>
                )}
              </div>
              <p className="search-hint">Tekan Esc untuk menutup.</p>
            </div>
          )}
          {dialog.type === "profile" && user && (
            <form
              className="form-stack"
              onSubmit={(event) =>
                void submitForm(event, async (data) => {
                  const result = await api<{ user: User }>("/profile", {
                    method: "PUT",
                    body: body({
                      name: data.get("name"),
                      organization: data.get("organization"),
                    }),
                  });
                  setUser(result.user);
                  setDialog(null);
                  notify("Profil tersimpan.");
                })
              }
            >
              <div className="profile-top">
                <span className="avatar big">{user.name[0]}</span>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <label>
                Nama lengkap
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={100}
                  defaultValue={user.name}
                  autoComplete="name"
                />
              </label>
              <label>
                Institusi / perusahaan
                <input
                  name="organization"
                  defaultValue={user.organization}
                  maxLength={160}
                  autoComplete="organization"
                />
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button className="button primary" disabled={busy}>
                Simpan profil
                <Check size={16} />
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => void logout()}
              >
                <LogOut size={16} />
                Keluar dari akun
              </button>
            </form>
          )}
          {dialog.type === "attendance" && (
            <form
              className="form-stack"
              onSubmit={(event) =>
                void submitForm(event, async (data) => {
                  await api(
                    "/registrations/" + dialog.registration.id + "/check-in",
                    { method: "POST", body: body({ code: data.get("code") }) },
                  );
                  await refreshPersonal();
                  setDialog(null);
                  notify("Absensi masuk tercatat.");
                })
              }
            >
              <h3>{dialog.registration.title}</h3>
              <p className="muted">
                Masukkan kode kehadiran yang diberikan pengelola saat webinar
                berlangsung.
              </p>
              <label>
                Kode kehadiran
                <input name="code" required maxLength={64} autoComplete="off" />
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button className="button primary" disabled={busy}>
                Catat kehadiran
                <Check size={16} />
              </button>
            </form>
          )}
          {dialog.type === "evaluation" && (
            <form
              className="form-stack"
              onSubmit={(event) =>
                void submitForm(event, async (data) => {
                  await api(
                    "/registrations/" + dialog.registration.id + "/evaluation",
                    {
                      method: "POST",
                      body: body({
                        rating: Number(data.get("rating")),
                        learning: data.get("learning"),
                      }),
                    },
                  );
                  await refreshPersonal();
                  setDialog(null);
                  notify("Evaluasi tersimpan. Terima kasih atas refleksimu.");
                })
              }
            >
              <h3>{dialog.registration.title}</h3>
              <label>
                Bagaimana pengalaman belajarmu?
                <select
                  name="rating"
                  required
                  defaultValue={dialog.registration.evaluationRating ?? ""}
                >
                  <option value="">Pilih penilaian</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option value={n} key={n}>
                      {n} —{" "}
                      {
                        [
                          "Sangat kurang",
                          "Kurang",
                          "Cukup",
                          "Baik",
                          "Sangat baik",
                        ][n - 1]
                      }
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Apa pengetahuan yang kamu dapatkan?
                <textarea
                  name="learning"
                  defaultValue={dialog.registration.evaluationLearning ?? ""}
                  required
                  minLength={10}
                  maxLength={1500}
                  rows={4}
                  placeholder="Bagikan refleksimu (minimal 10 karakter)."
                />
              </label>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button className="button primary" disabled={busy}>
                Simpan evaluasi
                <Check size={16} />
              </button>
            </form>
          )}
          {dialog.type === "meeting" && (
            <div className="updates-content">
              <ExternalLink size={35} />
              <h3>Selamat belajar bersama.</h3>
              <p>
                Tautan ini tersedia untuk peserta terdaftar selama sesi
                berlangsung. Catat absensi saat mengikuti kegiatan.
              </p>
              <a
                className="button primary"
                href={dialog.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka ruang webinar
                <ExternalLink size={16} />
              </a>
            </div>
          )}
          {dialog.type === "updates" && (
            <div className="updates-content">
              <CalendarDays size={35} />
              <h3>
                {latest
                  ? "Webinar tersedia untuk dijelajahi."
                  : "Webinar perdana sedang disiapkan."}
              </h3>
              <p>
                Jadwal dan narasumber ditampilkan setelah dikonfirmasi. Simpan
                program yang kamu minati atau tinggalkan email agar pengelola
                dapat menindaklanjuti.
              </p>
              <button
                className="button primary"
                onClick={() => open({ type: "interest" })}
              >
                Catat minat saya
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
function PageIntro({ content }: { content: [string, string, string] }) {
  return (
    <div className="page-intro">
      <div>
        <span className="eyebrow">{content[0]}</span>
        <h1>{content[1]}</h1>
        <p>{content[2]}</p>
      </div>
      <span className="intro-emblem">
        <MoveUpRight size={28} />
      </span>
    </div>
  );
}
function Faq() {
  return (
    <section className="panel faq">
      <SectionTitle title="Hal yang mungkin ingin kamu tahu" />
      {[
        [
          "Untuk siapa NEXIVO?",
          "Untuk siapa pun yang ingin belajar: mahasiswa, akademisi, profesional, pebisnis, dan pembelajar lintas bidang.",
        ],
        [
          "Kapan webinar pertama dibuka?",
          "Webinar perdana sedang disiapkan. Tanggal dan narasumber akan ditampilkan setelah dikonfirmasi. Kamu dapat mencatat minat melalui formulir pemberitahuan program.",
        ],
        [
          "Apakah semua program gratis?",
          "Model awal NEXIVO berfokus pada webinar gratis. Ketentuan setiap kegiatan dan pilihan sertifikat akan dijelaskan sebelum pendaftaran dibuka.",
        ],
        [
          "Bagaimana cara mendapat sertifikat?",
          "Sertifikat partisipasi bersifat opsional dan diterbitkan setelah kehadiran tervalidasi serta evaluasi selesai. Biaya tambahan, jika ada, harus diumumkan terlebih dahulu.",
        ],
        [
          "Apakah NEXIVO sudah menjadi institusi resmi?",
          "NEXIVO berada dalam tahap pengembangan. Informasi badan hukum, akreditasi, dan mitra akan diumumkan setelah terkonfirmasi.",
        ],
      ].map(([question, answer]) => (
        <details key={question}>
          <summary>
            <CircleHelp size={17} />
            <span>{question}</span>
            <PlusMark />
          </summary>
          <p>{answer}</p>
        </details>
      ))}
    </section>
  );
}
function PlusMark() {
  return (
    <span className="faq-plus" aria-hidden="true">
      +
    </span>
  );
}

function PreviewNotice({ onClose }: { onClose: () => void }) {
  return (
    <div className="preview-explanation">
      <span className="empty-icon">
        <CompassPreview />
      </span>
      <h3>Kamu sedang menjelajahi preview desain.</h3>
      <p>
        Preview ini menampilkan konsep NEXIVO dengan topik yang masih
        direncanakan. Pembuatan akun, penyimpanan minat, dan pendaftaran
        membutuhkan aplikasi dengan backend yang aktif.
      </p>
      <p>
        Tidak ada data pribadi yang dikirim atau disimpan melalui formulir pada
        preview ini.
      </p>
      <a href="#program" className="button primary" onClick={onClose}>
        Jelajahi topik <ArrowRight size={16} />
      </a>
    </div>
  );
}
function CompassPreview() {
  return <BookOpen size={28} />;
}
