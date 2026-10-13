import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Compass,
  Layers3,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  categories,
  CategoryIcon,
  categoryClasses,
  ProgramCard,
} from "../components";
import type { Category, Webinar } from "../types";
import PublicHeroArt from "./PublicHeroArt";
import PublicLearningStory from "./PublicLearningStory";

type Props = {
  events: Webinar[];
  currentTime: number;
  bookmarks: string[];
  onDetail: (event: Webinar) => void;
  onSave: (event: Webinar) => void;
  onCategory: (category: Category) => void;
  onInterest: () => void;
};

export default function PublicHome({
  events,
  currentTime,
  bookmarks,
  onDetail,
  onSave,
  onCategory,
  onInterest,
}: Props) {
  return (
    <div className="public-home">
      <section className="public-hero" aria-labelledby="public-hero-title">
        <div className="public-hero-copy">
          <span className="public-kicker">
            <span />
            RUANG BELAJAR, RUANG BERTUMBUH
          </span>
          <h1 id="public-hero-title">
            Wawasan baru.
            <br />
            Langkah <span>lebih maju.</span>
          </h1>
          <p>
            Temukan perspektif dan keterampilan baru lewat webinar lintas
            bidang. Ruang belajar untuk profesional, pebisnis, mahasiswa, dan
            siapa pun yang ingin berkembang.
          </p>
          <div className="public-hero-actions">
            <a className="button primary" href="#program">
              Jelajahi webinar <ArrowUpRight size={20} />
            </a>
            <a className="public-about-link" href="#tentang">
              Kenali NEXIVO <ArrowRight size={18} />
            </a>
          </div>
          <div className="public-hero-note">
            <span>
              <Check size={14} />
            </span>
            Mulai dari rasa ingin tahu. Bertumbuh lewat pengetahuan.
          </div>
        </div>
        <PublicHeroArt />
      </section>
      <section
        className="public-principles"
        aria-label="Cara belajar di NEXIVO"
      >
        <div>
          <BookOpen size={23} />
          <span>
            <strong>Topik lintas bidang</strong>
            <small>Wawasan untuk pekerjaan dan kehidupan</small>
          </span>
        </div>
        <div>
          <MessageCircle size={23} />
          <span>
            <strong>Ruang bertukar perspektif</strong>
            <small>Mempertemukan pembelajar dan praktisi</small>
          </span>
        </div>
        <div>
          <Compass size={23} />
          <span>
            <strong>Terbuka untuk semua</strong>
            <small>Di setiap tahap perjalanan belajar</small>
          </span>
        </div>
      </section>
      <section className="public-fields" aria-labelledby="fields-title">
        <div className="public-section-heading">
          <div>
            <span className="public-kicker">TEMUKAN BIDANGMU</span>
            <h2 id="fields-title">
              Banyak jalan menuju
              <br />
              wawasan yang lebih luas.
            </h2>
          </div>
          <p>
            Mulai dari bidang yang dekat dengan keseharianmu, atau jelajahi
            sesuatu yang sama sekali baru.
          </p>
        </div>
        <div className="public-field-list">
          {categories.map((category, index) => (
            <button
              key={category}
              onClick={() => onCategory(category)}
              className={`public-field ${categoryClasses[category]}`}
            >
              <span className="public-field-icon">
                <CategoryIcon category={category} size={24} />
              </span>
              <span>
                <small>0{index + 1}</small>
                <strong>{category}</strong>
              </span>
              <ArrowUpRight size={20} />
            </button>
          ))}
        </div>
      </section>
      <section
        className="public-programs"
        aria-labelledby="public-programs-title"
      >
        <div className="public-section-heading">
          <div>
            <span className="public-kicker">MULAI EKSPLORASIMU</span>
            <h2 id="public-programs-title">Topik untuk langkah berikutnya.</h2>
          </div>
          <a href="#program" className="public-section-link">
            Semua webinar <ArrowRight size={18} />
          </a>
        </div>
        {events.length ? (
          <div className="program-grid">
            {events.slice(0, 3).map((event) => (
              <ProgramCard
                key={event.id}
                event={event}
                currentTime={currentTime}
                saved={bookmarks.includes(event.id)}
                onOpen={() => onDetail(event)}
                onSave={() => onSave(event)}
              />
            ))}
          </div>
        ) : (
          <div className="public-program-empty">
            <BookOpen size={30} />
            <h3>Program sedang disiapkan.</h3>
            <p>Topik dan jadwal akan muncul di sini setelah tersedia.</p>
          </div>
        )}
        <p className="public-program-note">
          <ShieldCheck size={17} />
          Jadwal, narasumber, dan ketentuan final diumumkan sebelum pendaftaran
          dibuka.
        </p>
      </section>
      <PublicLearningStory onInterest={onInterest} />
      <section className="public-about-strip">
        <span className="public-about-symbol" aria-hidden="true">
          <Layers3 size={39} />
        </span>
        <div>
          <span className="public-kicker">
            NEXT GENERATION VIRTUAL LEARNING & KNOWLEDGE
          </span>
          <h2>Belajar. Terhubung. Bertumbuh.</h2>
          <p>
            NEXIVO dirancang sebagai ruang berbagi pengetahuan yang
            mempertemukan dunia profesional, usaha, dan akademik.
          </p>
        </div>
        <a className="button secondary" href="#tentang">
          Tentang NEXIVO <ArrowUpRight size={18} />
        </a>
      </section>
    </div>
  );
}
