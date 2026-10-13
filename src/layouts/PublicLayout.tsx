import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { Brand } from "../components";
import type { LayoutProps } from "./types";

const links = [
  { route: "beranda", text: "Beranda" },
  { route: "program", text: "Webinar" },
  { route: "tentang", text: "Tentang NEXIVO" },
  { route: "verifikasi", text: "Verifikasi sertifikat" },
];

export default function PublicLayout({
  children,
  route,
  user,
  theme,
  preview,
  onTheme,
  onAuth,
  onSearch,
}: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setMenuOpen(false);
  }, [route]);
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);
  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-header-inner">
          <Brand />
          <nav
            id="public-navigation"
            className={`public-navigation ${menuOpen ? "is-open" : ""}`}
            aria-label="Navigasi website"
          >
            {links.map((link) => (
              <a
                key={link.route}
                href={`#${link.route}`}
                aria-current={
                  route === link.route ||
                  (link.route === "verifikasi" &&
                    route.startsWith("verifikasi/"))
                    ? "page"
                    : undefined
                }
                onClick={() => {
                  setMenuOpen(false);
                  document
                    .getElementById("main")
                    ?.focus({ preventScroll: true });
                }}
              >
                {link.text}
              </a>
            ))}
          </nav>
          <div className="public-tools">
            <button
              className="icon-button"
              aria-label="Cari program"
              onClick={onSearch}
            >
              <Search size={20} />
            </button>
            <button
              className="icon-button"
              aria-label={
                theme === "light"
                  ? "Aktifkan tema gelap"
                  : "Aktifkan tema terang"
              }
              onClick={onTheme}
            >
              {theme === "light" ? <Moon size={19} /> : <Sun size={19} />}
            </button>
            {user ? (
              <a
                className="button primary public-login"
                href={user.role === "admin" ? "#admin" : "#dashboard"}
              >
                Dashboard <ArrowUpRight size={16} />
              </a>
            ) : (
              <button className="button primary public-login" onClick={onAuth}>
                Masuk <ArrowUpRight size={16} />
              </button>
            )}
            <button
              ref={toggle}
              className="icon-button public-menu-toggle"
              aria-label={menuOpen ? "Tutup menu website" : "Buka menu website"}
              aria-expanded={menuOpen}
              aria-controls="public-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
      </header>
      {preview && (
        <div className="public-preview" role="note">
          <span>PREVIEW DESAIN</span> Topik masih dalam perencanaan. Akun dan
          pendaftaran belum aktif pada preview online.
        </div>
      )}
      <div className={`public-content ${route === "beranda" ? "is-home" : ""}`}>
        {children}
      </div>
      <footer className="public-footer">
        <div className="public-footer-top">
          <div>
            <span className="public-kicker">LEARN. CONNECT. GROW.</span>
            <h2>
              Selalu ada ruang
              <br />
              untuk bertumbuh.
            </h2>
          </div>
          <a className="button public-footer-cta" href="#program">
            Temukan topikmu <ArrowRight size={18} />
          </a>
        </div>
        <div className="public-footer-grid">
          <div className="public-footer-brand">
            <Brand />
            <p>Next Generation Virtual Learning & Knowledge</p>
            <p>
              Mempertemukan rasa ingin tahu, pengetahuan, dan pengalaman melalui
              pembelajaran bersama.
            </p>
          </div>
          <nav aria-label="Jelajahi NEXIVO">
            <span>Jelajahi</span>
            <a href="#beranda">Beranda</a>
            <a href="#program">Webinar</a>
            <a href="#tentang">Tentang NEXIVO</a>
          </nav>
          <nav aria-label="Layanan NEXIVO">
            <span>Layanan</span>
            <a href="#verifikasi">Verifikasi sertifikat</a>
            <a href="#dashboard">Dashboard peserta</a>
            <a href="#admin">Area pengelola</a>
          </nav>
          <nav aria-label="Informasi NEXIVO">
            <span>Informasi</span>
            <a href="#privasi">Penggunaan data</a>
            <p>Jadwal dan ketentuan diumumkan sebelum pendaftaran dibuka.</p>
          </nav>
        </div>
        <div className="public-footer-bottom">
          <span>NEXIVO · Belajar. Terhubung. Bertumbuh.</span>
          <a href="#privasi">
            Transparansi penggunaan data <ArrowUpRight size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
}
