import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { api, body, errorMessage, setCsrf } from "./api";
import type { User } from "./types";

export default function AuthForm({
  onSuccess,
}: {
  onSuccess: (user: User) => void | Promise<void>;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: User; csrf: string }>("/auth/" + mode, {
        method: "POST",
        body: body({
          name: data.get("name"),
          email: data.get("email"),
          password: data.get("password"),
          organization: data.get("organization") ?? "",
          consent: data.get("consent") === "on",
        }),
      });
      setCsrf(result.csrf);
      await onSuccess(result.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="auth-intro">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h3>
          {mode === "login"
            ? "Senang bertemu lagi."
            : "Rasa ingin tahu membawa kita lebih jauh."}
        </h3>
        <p>
          {mode === "login"
            ? "Masuk untuk mengelola program dan perjalanan belajarmu."
            : "Buat akun untuk menyimpan program dan mengikuti webinar."}
        </p>
      </div>
      <div className="segmented">
        <button
          onClick={() => {
            setMode("login");
            setError("");
          }}
          className={mode === "login" ? "active" : ""}
          aria-pressed={mode === "login"}
        >
          Masuk
        </button>
        <button
          onClick={() => {
            setMode("register");
            setError("");
          }}
          className={mode === "register" ? "active" : ""}
          aria-pressed={mode === "register"}
        >
          Buat akun
        </button>
      </div>
      <form onSubmit={submit} className="form-stack">
        {mode === "register" && (
          <label>
            Nama lengkap
            <input
              name="name"
              autoComplete="name"
              minLength={2}
              maxLength={100}
              required
              placeholder="Nama yang akan tampil di sertifikat"
            />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="nama@email.com"
          />
        </label>
        <label>
          Kata sandi
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={12}
            maxLength={128}
            placeholder="Minimal 12 karakter"
          />
        </label>
        {mode === "register" && (
          <>
            <label>
              Institusi / perusahaan <span className="optional">opsional</span>
              <input
                name="organization"
                autoComplete="organization"
                maxLength={160}
                placeholder="Kampus, perusahaan, atau komunitas"
              />
            </label>
            <label className="checkbox-label">
              <input name="consent" type="checkbox" required />
              <span>
                Saya memahami <a href="#privasi">penggunaan data</a> untuk akun
                dan administrasi kegiatan NEXIVO.
              </span>
            </label>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={busy} type="submit">
          {busy
            ? "Memproses…"
            : mode === "login"
              ? "Masuk ke NEXIVO"
              : "Mulai perjalanan belajar"}
          <ArrowRight size={17} />
        </button>
        <p className="form-note">
          <LockKeyhole size={13} /> Data akunmu dikelola melalui koneksi dan
          sesi aplikasi.
        </p>
      </form>
    </>
  );
}
