import { useEffect, useId, useRef, type ReactNode } from "react";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  X,
  Leaf,
  Cog,
  ShieldCheck,
  BriefcaseBusiness,
  Cpu,
  GraduationCap,
  ArrowRight,
} from "lucide-react";
import type { Category, Webinar } from "./types";

export const categories: Category[] = [
  "Lingkungan",
  "Engineering",
  "HSE & K3",
  "Bisnis",
  "Teknologi",
  "Pendidikan",
];
export const categoryClasses: Record<Category, string> = {
  Lingkungan: "environment",
  Engineering: "engineering",
  "HSE & K3": "safety",
  Bisnis: "business",
  Teknologi: "technology",
  Pendidikan: "education",
};
export function CategoryIcon({
  category,
  size = 20,
}: {
  category: Category;
  size?: number;
}) {
  const Icon = {
    Lingkungan: Leaf,
    Engineering: Cog,
    "HSE & K3": ShieldCheck,
    Bisnis: BriefcaseBusiness,
    Teknologi: Cpu,
    Pendidikan: GraduationCap,
  }[category];
  return <Icon size={size} aria-hidden="true" />;
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <a
      href="#beranda"
      className={`brand ${small ? "small" : ""}`}
      aria-label="NEXIVO — beranda"
    >
      <span className="brand-mark">
        <img src="/logo.jpg" alt="" width="1808" height="1024" />
      </span>
      <span className="brand-name">
        NEXIVO<span>LEARN. CONNECT. GROW.</span>
      </span>
    </a>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-top">
          <h2 id={id}>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Tutup dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function StateCard({
  title,
  children,
  action,
  icon = <Bookmark size={27} />,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function ProgramArt({
  category,
  compact = false,
}: {
  category: Category;
  compact?: boolean;
}) {
  const variant = categories.indexOf(category);
  return (
    <div
      className={`program-art ${categoryClasses[category]} ${compact ? "compact" : ""}`}
      aria-hidden="true"
    >
      <span className="art-grid" />
      <svg viewBox="0 0 400 190" fill="none" className="art-shape">
        {variant === 0 ? (
          <>
            <ellipse
              cx="254"
              cy="104"
              rx="96"
              ry="38"
              transform="rotate(-30 254 104)"
            />
            <ellipse
              cx="254"
              cy="104"
              rx="96"
              ry="38"
              transform="rotate(30 254 104)"
            />
            <path
              d="M195 133c-6-58 24-85 95-84 0 61-31 87-95 84Z"
              fill="currentColor"
              fillOpacity=".1"
            />
            <path d="m191 139 100-91M236 94l-1-34m21 17 27 4M219 112l-1-27" />
          </>
        ) : variant === 1 ? (
          <>
            <path d="m237 25 65 38v75l-65 38-65-38V63l65-38Z" />
            <path d="m237 49 43 25v50l-43 25-43-25V74l43-25Z" />
            <path d="m237 25 0 151m-65-113 130 75m0-75-130 75" />
            <circle
              cx="237"
              cy="101"
              r="23"
              fill="currentColor"
              fillOpacity=".15"
            />
          </>
        ) : variant === 2 ? (
          <>
            <path
              d="m252 31 69 24v49c0 39-40 65-69 78-29-13-69-39-69-78V55l69-24Z"
              fill="currentColor"
              fillOpacity=".1"
            />
            <path d="m252 47 51 18v39c0 26-24 47-51 62-27-15-51-36-51-62V65l51-18Z" />
            <path d="m228 100 18 18 36-39" strokeWidth="4" />
            <circle cx="252" cy="101" r="94" />
          </>
        ) : variant === 3 ? (
          <>
            <path
              d="M170 141V85l29-16 29 16v56m8 0V59l29-16 29 16v82m8 0V31l29-16 29 16v110"
              fill="currentColor"
              fillOpacity=".12"
            />
            <path d="m170 85 29 17 29-17m-29 17v39m37-82 29 17 29-17m-29 17v65m37-110 29 17 29-17m-29 17v93M153 157h222" />
          </>
        ) : variant === 4 ? (
          <>
            <rect
              x="211"
              y="62"
              width="70"
              height="70"
              rx="13"
              fill="currentColor"
              fillOpacity=".12"
            />
            <rect x="225" y="76" width="42" height="42" rx="6" />
            <ellipse
              cx="246"
              cy="97"
              rx="115"
              ry="44"
              transform="rotate(-25 246 97)"
            />
            <ellipse
              cx="246"
              cy="97"
              rx="102"
              ry="40"
              transform="rotate(36 246 97)"
            />
            <circle cx="165" cy="73" r="7" fill="currentColor" />
            <circle cx="330" cy="126" r="5" fill="currentColor" />
          </>
        ) : (
          <>
            <path
              d="m164 58 78 23 78-23v81l-78 23-78-23V58Z"
              fill="currentColor"
              fillOpacity=".12"
            />
            <path d="M242 81v81m-66-89 49 15m-49 7 49 15m-49 7 49 15m31-44 49-15m-49 37 49-15m-49 37 49-15" />
            <path d="m150 148 92 28 92-28M174 46l68 21 68-21" />
          </>
        )}
      </svg>
      <span className="art-caption">
        NEXIVO <span>KNOWLEDGE SERIES</span>
      </span>
      <span className="art-number">0{variant + 1}</span>
    </div>
  );
}
export function ProgramCard({
  event,
  currentTime,
  saved,
  onOpen,
  onSave,
}: {
  event: Webinar;
  currentTime: number;
  saved: boolean;
  onOpen: () => void;
  onSave: () => void;
}) {
  const ended =
    event.status === "completed" ||
    !!(event.endsAt && Date.parse(event.endsAt) <= currentTime);
  const started = !!(
    event.startsAt && Date.parse(event.startsAt) <= currentTime
  );
  const status =
    event.status === "planned"
      ? "Dalam persiapan"
      : ended
        ? "Selesai"
        : started
          ? "Sedang berlangsung"
          : event.registered >= event.capacity
            ? "Kuota penuh"
            : "Pendaftaran dibuka";
  return (
    <article className="program-card">
      <div className="program-visual">
        <ProgramArt category={event.category} />
        <button
          className={`save-button ${saved ? "saved" : ""}`}
          onClick={onSave}
          aria-label={`${saved ? "Hapus simpanan" : "Simpan"} ${event.title}`}
          aria-pressed={saved}
        >
          <Bookmark size={18} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="program-copy">
        <div className="card-eyebrow">
          <span className={`category-label ${categoryClasses[event.category]}`}>
            <CategoryIcon category={event.category} size={13} />
            {event.category}
          </span>
          <span className="program-status">{status}</span>
        </div>
        <h3>
          <button className="title-button" onClick={onOpen}>
            {event.title}
          </button>
        </h3>
        <p>{event.summary}</p>
        <div className="card-bottom">
          <span>
            {event.startsAt
              ? formatDate(event.startsAt)
              : "Jadwal akan diumumkan"}
          </span>
          <button
            className="card-arrow"
            onClick={onOpen}
            aria-label={`Lihat detail ${event.title}`}
          >
            <ArrowUpRight size={19} />
          </button>
        </div>
      </div>
    </article>
  );
}
export function formatDate(value: string, full = false) {
  return new Date(value).toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: full ? "long" : "short",
    year: full ? "numeric" : undefined,
  });
}
export function formatTime(value: string) {
  return (
    new Date(value).toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}
export function CheckItem({
  done,
  title,
  subtitle,
}: {
  done: boolean;
  title: string;
  subtitle: string;
}) {
  return (
    <li className={done ? "done" : ""}>
      <span className="step-check">
        {done ? <Check size={14} /> : <span />}
      </span>
      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </li>
  );
}
export function SectionTitle({
  title,
  subtitle,
  href,
  link = "Lihat semua",
}: {
  title: string;
  subtitle?: string;
  href?: string;
  link?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <a href={href}>
          {link}
          <ArrowRight size={16} />
        </a>
      )}
    </div>
  );
}
