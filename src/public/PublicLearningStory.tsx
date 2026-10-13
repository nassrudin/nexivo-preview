import { ArrowUpRight, Compass, GraduationCap, Users } from "lucide-react";
export default function PublicLearningStory({
  onInterest,
}: {
  onInterest: () => void;
}) {
  return (
    <section
      className="public-learning-story"
      aria-labelledby="learning-story-title"
    >
      <div className="public-story-intro">
        <span className="public-kicker">BELAJAR DENGAN ARAH</span>
        <h2 id="learning-story-title">
          Dari rasa ingin tahu,
          <br />
          jadi langkah nyata.
        </h2>
        <p>
          Perjalanan belajar tidak harus rumit. Temukan topik yang relevan,
          ikuti kegiatan, dan bawa pulang perspektif baru.
        </p>
        <button className="public-section-link" onClick={onInterest}>
          Catat minat saya <ArrowUpRight size={18} />
        </button>
      </div>
      <ol className="public-learning-steps">
        {[
          {
            title: "Temukan topik yang relevan",
            text: "Jelajahi bidang dan baca gambaran materi yang ingin kamu pelajari.",
            icon: Compass,
          },
          {
            title: "Ikuti webinar pilihanmu",
            text: "Daftar setelah jadwal dibuka, lalu bergabung sesuai informasi kegiatan.",
            icon: Users,
          },
          {
            title: "Lanjutkan perjalanan belajarmu",
            text: "Kelola aktivitas dan sertifikat sesuai ketentuan melalui dashboard peserta.",
            icon: GraduationCap,
          },
        ].map((step, index) => (
          <li key={step.title}>
            <span className="public-step-number">0{index + 1}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
            <step.icon size={22} />
          </li>
        ))}
      </ol>
    </section>
  );
}
