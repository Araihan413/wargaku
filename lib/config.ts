import { randomBytes } from "crypto";

/**
 * Mendapatkan Base URL aplikasi secara fleksibel dan terpusat dari satu sumber.
 * Prioritas:
 * 1. window.location.origin (jika dieksekusi di browser/client-side)
 * 2. NEXT_PUBLIC_APP_URL dari environment variable (.env)
 * 3. BETTER_AUTH_URL dari environment variable (.env)
 * 4. Host dari HTTP request headers (jika dipanggil di API route)
 * 5. Fallback standar lokal: http://localhost:3000
 */
export function getAppBaseUrl(req?: Request): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
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
