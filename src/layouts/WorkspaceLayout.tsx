import { useEffect, useRef, useState, type RefObject } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Bell,
  Bookmark,
  BookOpen,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sun,
  Users,
  X,
} from "lucide-react";
import { Brand } from "../components";
import type { LayoutProps } from "./types";

const learningNav = [
  { id: "dashboard", text: "Ringkasan", icon: LayoutDashboard },
  { id: "belajarku", text: "Belajar saya", icon: Bookmark },
  { id: "sertifikat", text: "Sertifikat saya", icon: Award },
];
const managementNav = [
  { id: "admin", text: "Ringkasan", icon: LayoutDashboard },
  { id: "admin/webinar", text: "Kelola webinar", icon: BookOpen },
  { id: "admin/peserta", text: "Peserta & sertifikat", icon: Users },
  { id: "admin/minat", text: "Minat program", icon: ClipboardList },
];

export default function WorkspaceLayout(props: LayoutProps) {
  const { children, route, user, preview, onAuth, onProfile, onLogout } = props;
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const management = route === "admin" || route.startsWith("admin/");
  const navigation = management ? managementNav : learningNav;
  const current =
    navigation.find((item) => item.id === route)?.text || "Dashboard";
  useEffect(() => {
    setMenuOpen(false);
  }, [route]);
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document
      .querySelector<HTMLButtonElement>(".app-sidebar .sidebar-close")
      ?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (document.querySelector("dialog[open]")) return;
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggle.current?.focus();
      }
      if (event.key === "Tab") {
        const controls = document.querySelectorAll<HTMLElement>(
          ".app-sidebar a[href], .app-sidebar button:not(:disabled)",
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);
  return (
    <div
      className={`app-shell workspace-shell ${management ? "management-shell" : "participant-shell"}`}
    >
      {menuOpen && (
        <button
          className="navigation-backdrop"
          aria-label="Tutup navigasi"
          tabIndex={-1}
          onClick={() => {
            setMenuOpen(false);
            toggle.current?.focus();
          }}
        />
      )}
      <aside
        className={`app-sidebar ${menuOpen ? "is-open" : ""}`}
        id="app-navigation"
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen || undefined}
        aria-label={menuOpen ? "Navigasi dashboard" : undefined}
        onClick={(event) => {
          if ((event.target as Element).closest("a")) {
            setMenuOpen(false);
            document.getElementById("main")?.focus({ preventScroll: true });
          }
        }}
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button sidebar-close"
            aria-label="Tutup menu"
            onClick={() => {
              setMenuOpen(false);
              toggle.current?.focus();
            }}
          >
            <X size={21} />
          </button>
        </div>
        <span className="workspace-role">
          <ShieldCheck size={14} />
          {management ? "AREA PENGELOLA" : "DASHBOARD PESERTA"}
        </span>
        <span className="sidebar-label">
          {management ? "MANAJEMEN NEXIVO" : "RUANG BELAJARMU"}
        </span>
        <nav
          className="sidebar-nav"
          aria-label={management ? "Navigasi pengelola" : "Navigasi peserta"}
        >
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={route === item.id ? "active" : ""}
              aria-current={route === item.id ? "page" : undefined}
            >
              <item.icon size={19} />
              <span>{item.text}</span>
            </a>
          ))}
        </nav>
        <div className="sidebar-secondary">
          <span className="sidebar-label">AKSES LAINNYA</span>
          <a href="#beranda">
            <ExternalLink size={18} />
            Website publik
          </a>
          {management ? (
            <a href="#dashboard">
              <Bookmark size={18} />
              Ruang belajar
            </a>
          ) : (
            <a href="#program">
              <BookOpen size={18} />
              Jelajahi webinar
            </a>
          )}
          {!management && user?.role === "admin" && (
            <a href="#admin">
              <ShieldCheck size={18} />
              Area pengelola
            </a>
          )}
        </div>
        <div className="workspace-sidebar-note">
          <span>
            {management ? "Kelola dengan terarah." : "Satu langkah lebih maju."}
          </span>
          <p>
            {management
              ? "Jadwal, peserta, dan administrasi kegiatan dalam satu ruang kerja."
              : "Simpan topik, ikuti webinar, dan kelola perjalanan belajarmu."}
          </p>
        </div>
        <div className="workspace-sidebar-account">
          {user ? (
            <>
              <button onClick={onProfile}>
                <span className="workspace-initials">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span>
                  <strong>{user.name}</strong>
                  <small>
                    {user.role === "admin" ? "Pengelola" : "Peserta"}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
              <button className="workspace-logout" onClick={onLogout}>
                <LogOut size={17} />
                Keluar akun
              </button>
            </>
          ) : (
            <button className="workspace-guest-login" onClick={onAuth}>
              Masuk ke akun <ArrowUpRight size={17} />
            </button>
          )}
        </div>
      </aside>
      <div className="app-workspace">
        <WorkspaceHeader
          layout={props}
          management={management}
          current={current}
          menuOpen={menuOpen}
          toggle={toggle}
          onToggle={() => setMenuOpen(!menuOpen)}
        />
        {preview && (
          <div className="preview-notice">
            <span>PREVIEW DESAIN</span>
            <p>
              {management
                ? "Area pengelola memerlukan akun admin pada aplikasi dengan backend. Preview ini tidak memuat data peserta."
                : "Ini tampilan dashboard peserta. Akun dan aktivitas nyata memerlukan backend."}
            </p>
          </div>
        )}
        {children}
        <footer className="workspace-footer">
          <span>NEXIVO / {management ? "Pengelola" : "Peserta"}</span>
          <a href="#beranda">
            <ArrowLeft size={14} />
            Kembali ke website
          </a>
        </footer>
      </div>
    </div>
  );
}

function WorkspaceHeader({
  layout,
  management,
  current,
  menuOpen,
  toggle,
  onToggle,
}: {
  layout: LayoutProps;
  management: boolean;
  current: string;
  menuOpen: boolean;
  toggle: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}) {
  const { user, theme, onSearch, onTheme, onUpdates, onProfile, onAuth } =
    layout;
  return (
    <header className="workspace-header">
      <div className="workspace-header-context">
        <button
          ref={toggle}
          className="icon-button mobile-toggle"
          aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
          aria-expanded={menuOpen}
          aria-controls="app-navigation"
          onClick={onToggle}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div>
          <span>
            {management ? "Ruang kerja pengelola" : "Ruang belajar peserta"}
          </span>
          <strong>{current}</strong>
        </div>
      </div>
      <div className="header-tools">
        <button
          className="icon-button"
          aria-label="Cari program"
          onClick={onSearch}
        >
          <Search size={19} />
        </button>
        <button
          className="icon-button theme-button"
          aria-label={
            theme === "light" ? "Aktifkan tema gelap" : "Aktifkan tema terang"
          }
          onClick={onTheme}
        >
          {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
        </button>
        <button
          className="icon-button notification-button"
          aria-label="Informasi kegiatan"
          onClick={onUpdates}
        >
          <Bell size={19} />
        </button>
        {user ? (
          <button
            className="workspace-header-avatar"
            onClick={onProfile}
            aria-label={`Profil ${user.name}`}
          >
            {user.name.slice(0, 1).toUpperCase()}
          </button>
        ) : (
          <button className="button login-button" onClick={onAuth}>
            Masuk <ChevronRight size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
