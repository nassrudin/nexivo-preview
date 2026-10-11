import { useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Compass,
  GraduationCap,
  Play,
  Sparkles,
} from "lucide-react";
import {
  categories,
  CategoryIcon,
  categoryClasses,
  formatDate,
  formatTime,
} from "./components";
import type { User, Webinar } from "./types";

type Props = {
  user: User | null;
  events: Webinar[];
  currentTime: number;
  bookmarks: number;
  registrations: number;
  renderPrograms: (events: Webinar[]) => ReactNode;
  onInterest: () => void;
  onAuth: () => void;
  onDetail: (event: Webinar) => void;
};

function LearningIllustration() {
  return (
    <svg
      className="learning-illustration"
      viewBox="0 0 400 290"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="222" cy="144" r="117" fill="white" fillOpacity=".09" />
      <circle
        cx="222"
        cy="144"
        r="85"
        stroke="white"
        strokeOpacity=".2"
        strokeDasharray="3 9"
      />
      <g className="illustration-orbit">
        <path
          d="m323 32 3 10 10 3-10 3-3 10-3-10-10-3 10-3 3-10Z"
          fill="#FFE69A"
        />
        <circle cx="78" cy="181" r="6" fill="#BDEFD8" />
        <circle cx="330" cy="204" r="5" fill="white" fillOpacity=".6" />
        <path
          d="m125 47 4 4m-4 0 4-4"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(-9 230 145)">
        <rect x="121" y="71" width="207" height="145" rx="13" fill="#163F9C" />
        <rect x="128" y="78" width="193" height="129" rx="8" fill="#F8FBFF" />
        <rect x="139" y="88" width="171" height="16" rx="4" fill="#EDF0F8" />
        <circle cx="148" cy="96" r="2" fill="#FA8CAF" />
        <circle cx="155" cy="96" r="2" fill="#F4C85B" />
        <circle cx="162" cy="96" r="2" fill="#6FC9AE" />
        <rect x="139" y="112" width="102" height="71" rx="6" fill="#CCE6FF" />
        <circle cx="190" cy="147" r="20" fill="#4388F0" />
        <path d="m186 138 13 9-13 9v-18Z" fill="white" />
        <rect x="250" y="114" width="58" height="7" rx="3.5" fill="#A5B8D9" />
        <rect x="250" y="128" width="44" height="5" rx="2.5" fill="#D8E2F1" />
        <rect x="250" y="139" width="52" height="5" rx="2.5" fill="#D8E2F1" />
        <rect x="250" y="155" width="58" height="28" rx="5" fill="#E9E3FA" />
        <rect x="139" y="191" width="93" height="5" rx="2.5" fill="#D8E2F1" />
        <path d="M104 216h242l-17 15H121l-17-15Z" fill="#D6E6FF" />
        <path d="M204 216h42l-4 5h-34l-4-5Z" fill="#A8C8F9" />
      </g>
      <g className="illustration-float">
        <rect
          x="67"
          y="53"
          width="76"
          height="75"
          rx="15"
          transform="rotate(-14 67 53)"
          fill="#FFDB83"
        />
        <path d="m85 77 21-6 9 7-9 10-21 6-9-7 9-10Z" fill="#A57522" />
        <path
          d="m88 90 3 10 23-6-3-10m-29 5 3 11"
          stroke="#A57522"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </g>
      <g className="illustration-float delayed">
        <rect
          x="288"
          y="159"
          width="73"
          height="69"
          rx="15"
          transform="rotate(10 288 159)"
          fill="#C4F3DE"
        />
        <path
          d="m309 185 9 10 18-20"
          stroke="#288669"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <path d="M83 245c12-24 8-39-1-53-10 18-13 32 1 53Z" fill="#94DDC1" />
      <path d="M85 246c0-22 11-34 25-39 0 21-8 33-25 39Z" fill="#BFEFDD" />
      <path d="M69 242h31l-5 21H74l-5-21Z" fill="#F0F5FF" />
      <ellipse
        cx="224"
        cy="266"
        rx="102"
        ry="5"
        fill="#165AC7"
        fillOpacity=".25"
      />
    </svg>
  );
}

function CalendarPanel({
  events,
  currentTime,
  onDetail,
  onInterest,
}: Pick<Props, "events" | "currentTime" | "onDetail" | "onInterest">) {
  const today = new Date(
    new Date(currentTime).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }),
  );
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const year = month.getFullYear();
  const monthNumber = month.getMonth();
  const label = month.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const dateKey = (day: number) =>
    `${year}-${String(monthNumber + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const scheduled = events.filter(
    (e) =>
      e.status === "published" &&
      e.startsAt &&
      e.endsAt &&
      Date.parse(e.endsAt) > currentTime,
  );
  const keyForEvent = (event: Webinar) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(event.startsAt!));
  const agenda = (
    selected ? scheduled.filter((e) => keyForEvent(e) === selected) : scheduled
  ).sort((a, b) => Date.parse(a.startsAt!) - Date.parse(b.startsAt!));
  const blanks = (month.getDay() + 6) % 7;
  const days = new Date(year, monthNumber + 1, 0).getDate();
  const changeMonth = (amount: number) => {
    setOffset(offset + amount);
    setSelected(null);
  };
  return (
    <section
      className="calendar-panel"
      aria-label="Kalender dan agenda webinar"
    >
      <div className="panel-heading">
        <h2>
          <CalendarDays size={19} /> Kalender belajar
        </h2>
        <span className="soft-icon">
          <Sparkles size={16} />
        </span>
      </div>
      <div className="calendar-month">
        <span aria-live="polite">{label}</span>
        <div>
          <button
            className="icon-button"
            aria-label="Bulan sebelumnya"
            onClick={() => changeMonth(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            className="icon-button"
            aria-label="Bulan berikutnya"
            onClick={() => changeMonth(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="calendar-week" aria-hidden="true">
        {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div
        className="calendar-days"
        role="group"
        aria-label={`Pilih tanggal pada ${label}`}
      >
        {Array.from({ length: blanks }, (_, i) => (
          <span key={`blank${i}`} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1,
            key = dateKey(day),
            isToday = offset === 0 && day === today.getDate(),
            hasEvent = scheduled.some((e) => keyForEvent(e) === key);
          return (
            <button
              key={day}
              className={`${isToday ? "today" : ""} ${selected === key ? "selected" : ""} ${hasEvent ? "has-event" : ""}`}
              aria-label={`${day} ${label}${isToday ? ", hari ini" : ""}${hasEvent ? ", ada webinar" : ""}`}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={selected === key}
              onClick={() => setSelected(selected === key ? null : key)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="agenda-heading">
        <h3>{selected ? "Agenda tanggal pilihan" : "Agenda mendatang"}</h3>
        {(selected || offset !== 0) && (
          <button
            className="text-link"
            onClick={() => {
              setOffset(0);
              setSelected(null);
            }}
          >
            Hari ini
          </button>
        )}
      </div>
      <div className="calendar-agenda" aria-live="polite">
        {agenda.length ? (
          agenda.slice(0, 2).map((event) => (
            <button
              key={event.id}
              className="agenda-event"
              onClick={() => onDetail(event)}
            >
              <span className="agenda-date">
                {new Date(event.startsAt!).toLocaleDateString("id-ID", {
                  timeZone: "Asia/Jakarta",
                  day: "numeric",
                })}
                <small>
                  {new Date(event.startsAt!).toLocaleDateString("id-ID", {
                    timeZone: "Asia/Jakarta",
                    month: "short",
                  })}
                </small>
              </span>
              <span>
                <strong>{event.title}</strong>
                <small>{formatTime(event.startsAt!)}</small>
              </span>
              <ChevronRight size={15} />
            </button>
          ))
        ) : (
          <div className="agenda-placeholder">
            <span className="agenda-empty-icon">
              <CalendarDays size={23} />
            </span>
            <h4>
              {selected ? "Belum ada agenda" : "Hal baik sedang disiapkan"}
            </h4>
            <p>
              {selected
                ? "Belum ada webinar terjadwal pada tanggal ini. Jelajahi topik sambil menunggu."
                : "Jadwal webinar akan tampil di sini setelah dikonfirmasi."}
            </p>
            <button className="text-link" onClick={onInterest}>
              Kabari saya nanti <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
      {!selected && agenda.length > 0 && (
        <p className="calendar-timezone">Semua waktu dalam WIB.</p>
      )}
    </section>
  );
}

export default function Dashboard({
  user,
  events,
  currentTime,
  bookmarks,
  registrations,
  renderPrograms,
  onInterest,
  onAuth,
  onDetail,
}: Props) {
  const [category, setCategory] = useState("Semua");
  const featured = events.filter(
    (event) => category === "Semua" || event.category === category,
  );
  const planned = events.filter((e) => e.status === "planned").length;
  const upcoming = events.filter(
    (e) =>
      e.status === "published" &&
      e.endsAt &&
      Date.parse(e.endsAt) > currentTime,
  ).length;
  const completed = events.filter(
    (e) =>
      e.status === "completed" ||
      (e.status !== "planned" &&
        e.endsAt &&
        Date.parse(e.endsAt) <= currentTime),
  ).length;
  const steps = [
    { done: !!user, text: "Buat akun belajar" },
    { done: bookmarks > 0, text: "Simpan topik pilihan" },
    { done: registrations > 0, text: "Ikuti webinar pertama" },
  ];
  const done = steps.filter((step) => step.done).length;
  return (
    <div className="learning-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="dashboard-overline">RUANG BELAJAR NEXIVO</span>
          <h1>
            {user ? `Hai, ${user.name.split(" ")[0]}!` : "Hai, selamat datang!"}{" "}
            <span className="greeting-spark" aria-hidden="true">
              ✦
            </span>
          </h1>
          <p>Hari yang baik untuk menemukan hal baru.</p>
        </div>
        <span className="dashboard-date">
          <CalendarDays size={15} />
          {formatDate(new Date(currentTime).toISOString(), true)}
        </span>
      </div>
      <div className="learning-grid">
        <div className="learning-main">
          <section className="welcome-banner">
            <div className="welcome-copy">
              <span className="welcome-kicker">
                <span />
                LEARN. CONNECT. GROW.
              </span>
              <h2>
                Langkah kecil hari ini.
                <br />
                Wawasan besar esok hari.
              </h2>
              <p>
                Temukan ide, bangun keterampilan, dan bertumbuh bersama lewat
                webinar NEXIVO.
              </p>
              <a className="welcome-cta" href="#program">
                Jelajahi webinar <ArrowUpRight size={18} />
              </a>
            </div>
            <LearningIllustration />
          </section>
          <div className="webinar-overview" aria-label="Ringkasan program">
            <div className="overview-tile pink">
              <span className="overview-icon">
                <Compass size={22} />
              </span>
              <div>
                <strong>Dalam persiapan</strong>
                <span>{planned} topik eksplorasi</span>
              </div>
              <span className="overview-number">
                {planned.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="overview-tile mint">
              <span className="overview-icon">
                <Play size={21} />
              </span>
              <div>
                <strong>Akan berlangsung</strong>
                <span>
                  {upcoming ? "Webinar terjadwal" : "Jadwal menyusul"}
                </span>
              </div>
              <span className="overview-number">
                {upcoming.toString().padStart(2, "0")}
              </span>
            </div>
            <div className="overview-tile lilac">
              <span className="overview-icon">
                <Check size={22} />
              </span>
              <div>
                <strong>Telah selesai</strong>
                <span>
                  {completed ? "Webinar selesai" : "Perjalanan baru dimulai"}
                </span>
              </div>
              <span className="overview-number">
                {completed.toString().padStart(2, "0")}
              </span>
            </div>
          </div>
          <section
            className="discover-section"
            aria-labelledby="discover-title"
          >
            <div className="studio-section-heading">
              <div>
                <h2 id="discover-title">Mau belajar apa hari ini?</h2>
                <p>Mulai dari bidang yang membuatmu penasaran.</p>
              </div>
              <a href="#program">
                Lihat semua <ArrowUpRight size={16} />
              </a>
            </div>
            <div
              className="discovery-filters"
              role="group"
              aria-label="Filter bidang di beranda"
            >
              <button
                className={category === "Semua" ? "active" : ""}
                aria-pressed={category === "Semua"}
                onClick={() => setCategory("Semua")}
              >
                Semua
              </button>
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "active" : ""}
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <div aria-live="polite" className="featured-programs">
              {featured.length ? (
                renderPrograms(featured.slice(0, 3))
              ) : (
                <div className="no-featured">
                  <BookEmpty />
                  <p>Topik di bidang ini sedang disiapkan.</p>
                </div>
              )}
            </div>
            <p className="planned-note">
              <span /> Topik eksplorasi · Jadwal dan narasumber akan diumumkan.
            </p>
          </section>
          <section className="topic-section" aria-labelledby="topic-title">
            <div className="studio-section-heading">
              <div>
                <h2 id="topic-title">Wawasan untuk setiap langkah</h2>
                <p>Untuk pekerjaan, usaha, dan pengembangan diri.</p>
              </div>
              <GraduationCap size={23} />
            </div>
            <div className="topic-grid">
              {categories.slice(3).map((item) => (
                <button
                  key={item}
                  className={`topic-tile ${categoryClasses[item]}`}
                  onClick={() => {
                    setCategory(item);
                    document
                      .getElementById("discover-title")
                      ?.scrollIntoView({
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)",
                        ).matches
                          ? "instant"
                          : "smooth",
                        block: "center",
                      });
                  }}
                >
                  <span>
                    <CategoryIcon category={item} size={23} />
                  </span>
                  <div>
                    <strong>{item}</strong>
                    <small>Jelajahi topik</small>
                  </div>
                  <ChevronRight size={18} />
                </button>
              ))}
            </div>
          </section>
          <div className="learning-note">
            <span>
              <ShieldIcon />
            </span>
            <p>
              <strong>Belajar dengan lebih tenang.</strong> Informasi jadwal,
              narasumber, dan ketentuan selalu ditampilkan sebelum kamu
              mendaftar.
            </p>
          </div>
        </div>
        <aside
          className="learning-aside"
          aria-label="Agenda dan perjalanan belajar"
        >
          <CalendarPanel
            events={events}
            currentTime={currentTime}
            onDetail={onDetail}
            onInterest={onInterest}
          />
          <section className="start-panel">
            <div className="panel-heading">
              <h2>Perjalanan belajarmu</h2>
              <span className="step-count">{done}/3</span>
            </div>
            <p>Setiap langkah kecil berarti.</p>
            <div
              className="studio-progress"
              role="progressbar"
              aria-label="Langkah memulai"
              aria-valuemin={0}
              aria-valuemax={3}
              aria-valuenow={done}
            >
              <span style={{ width: `${(done / 3) * 100}%` }} />
            </div>
            <ul>
              {steps.map((step) => (
                <li key={step.text} className={step.done ? "done" : ""}>
                  <span>{step.done ? <Check size={12} /> : <span />}</span>
                  {step.text}
                </li>
              ))}
            </ul>
            {user ? (
              <a className="start-action" href="#belajarku">
                Buka belajarku <ArrowRight size={15} />
              </a>
            ) : (
              <button className="start-action" onClick={onAuth}>
                Mulai perjalanan <ArrowRight size={15} />
              </button>
            )}
          </section>
          <section className="together-panel">
            <span className="together-orb" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="dashboard-overline">TUMBUH BERSAMA</span>
            <h2>Pengetahuan membuka lebih banyak pintu.</h2>
            <p>Ruang belajar untuk semua, di setiap tahap perjalanan.</p>
            <a href="#tentang">
              Kenali NEXIVO <ArrowUpRight size={16} />
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function BookEmpty() {
  return <GraduationCap size={30} aria-hidden="true" />;
}
function ShieldIcon() {
  return <Clock3 size={19} aria-hidden="true" />;
}
