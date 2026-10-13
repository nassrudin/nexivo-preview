import {
  BookOpen,
  BriefcaseBusiness,
  Cpu,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function PublicHeroArt() {
  return (
    <div className="public-hero-art" aria-hidden="true">
      <div className="public-art-halo" />
      <div className="public-art-orbit orbit-one" />
      <div className="public-art-orbit orbit-two" />
      <div className="public-art-book">
        <svg viewBox="0 0 360 270" fill="none">
          <ellipse
            cx="180"
            cy="240"
            rx="131"
            ry="14"
            fill="#16366C"
            fillOpacity=".08"
          />
          <path
            d="m29 72 151 42 151-42v126l-151 44-151-44V72Z"
            fill="#C7DFFF"
          />
          <path d="m42 62 138 40v124L42 186V62Z" fill="#FFFFFF" />
          <path d="m180 102 138-40v124l-138 40V102Z" fill="#EDF5FF" />
          <path d="M180 102v124" stroke="#94B9EF" strokeWidth="3" />
          <path
            d="m66 93 88 25m-88-1 88 25m-88-1 88 25m-88-1 55 16"
            stroke="#D3E3F8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <rect
            x="205"
            y="114"
            width="83"
            height="55"
            rx="7"
            transform="rotate(-16 205 114)"
            fill="#1761D0"
          />
          <path d="m237 119 19 6-15 16-4-22Z" fill="#fff" />
          <path
            d="m208 184 79-23"
            stroke="#C0D4F2"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M180 44v20m-9-10h18"
            stroke="#F0BE55"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="public-floating-card art-topic-one">
        <span>
          <ShieldCheck size={21} />
        </span>
        <div>
          <strong>HSE & K3</strong>
          <small>Budaya kerja yang lebih aman</small>
        </div>
        <span className="public-art-check">✓</span>
      </div>
      <div className="public-floating-card art-topic-two">
        <span>
          <Cpu size={22} />
        </span>
        <div>
          <strong>Teknologi</strong>
          <small>Wawasan untuk era digital</small>
        </div>
      </div>
      <div className="public-floating-card art-topic-three">
        <span>
          <BriefcaseBusiness size={20} />
        </span>
        <div>
          <strong>Bisnis</strong>
          <small>Perspektif untuk bertumbuh</small>
        </div>
      </div>
      <span className="public-art-cap">
        <GraduationCap size={31} />
      </span>
      <span className="public-art-spark">
        <Sparkles size={26} />
      </span>
      <div className="public-art-caption">
        <BookOpen size={15} />
        <span>Pengetahuan untuk setiap langkah.</span>
      </div>
    </div>
  );
}
