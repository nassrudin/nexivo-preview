import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import type { Request, Response, NextFunction } from "express";

const scrypt = promisify(scryptCallback);
export const randomToken = () => randomBytes(32).toString("hex");
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, encoded: string) {
  const [salt, hash] = encoded.split(":");
  if (!salt || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(hash, "hex"), key);
}
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function securityHeaders(production: boolean) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'" +
        (production ? "" : " 'unsafe-inline'") +
        "; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'" +
        (production ? "" : " ws://127.0.0.1:* ws://localhost:*") +
        "; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
    );
    if (production)
      res.setHeader("Strict-Transport-Security", "max-age=31536000");
    next();
  };
}
export function rateLimiter(limit: number, windowMs: number) {
  const entries = new Map<string, { count: number; expires: number }>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    if (entries.size > 10000)
      for (const [key, value] of entries)
        if (value.expires < now) entries.delete(key);
    const key = req.socket.remoteAddress ?? "local";
    let entry = entries.get(key);
    if (!entry || entry.expires < now) {
      entry = { count: 0, expires: now + windowMs };
      entries.set(key, entry);
    }
    if (++entry.count > limit) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil((entry.expires - now) / 1000)),
      );
      res
        .status(429)
        .json({
          error:
            "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.",
        });
      return;
    }
    next();
  };
}
export function attendancePercent(
  startsAt: string,
  endsAt: string,
  checkIn: string | null,
  checkOut: string | null,
) {
  if (!checkIn || !checkOut) return 0;
  const start = Date.parse(startsAt);
  const end = Date.parse(endsAt);
  if (end <= start) return 0;
  const attended = Math.max(
    0,
    Math.min(Date.parse(checkOut), end) - Math.max(Date.parse(checkIn), start),
  );
  return Math.min(100, Math.floor((attended / (end - start)) * 100));
}
export function meetingUrlAllowed(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "meet.google.com" ||
        url.hostname === "zoom.us" ||
        url.hostname.endsWith(".zoom.us"))
    );
  } catch {
    return false;
  }
}
