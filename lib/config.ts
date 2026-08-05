import { randomBytes } from "crypto";

/**
 * Mendapatkan Base URL aplikasi secara fleksibel.
 * Berfungsi otomatis untuk localhost saat development dan domain resmi saat produksi.
 */
export function getAppBaseUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  }
  if (req) {
    const host = req.headers.get("host");
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    if (host) return `${protocol}://${host}`;
  }
  return "http://localhost:3000";
}

/**
 * Menghasilkan password temporary acak dengan pola:
 * [DEFAULT_PASSWORD_DARI_ENV]-[5_KARAKTER_ACAK]
 * Contoh: wargaku123-k8A9x
 */
export function generateTemporaryPassword(): string {
  const basePassword = process.env.DEFAULT_PASSWORD || "wargaku123";
  const randomSuffix = randomBytes(3).toString("hex").slice(0, 5); // 5 random hex chars
  return `${basePassword}-${randomSuffix}`;
}
