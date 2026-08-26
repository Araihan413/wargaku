import crypto from "crypto";

// =============================================================================
// KONFIGURASI KUNCI ENKRIPSI
// =============================================================================

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.PII_ENCRYPTION_KEY ?? "";
// Gunakan PII_HASH_SALT jika ada
const SALT = process.env.PII_HASH_SALT || "wargaku_fallback_local_salt";

/**
 * Ambil kunci enkripsi dari env sebagai Buffer 32-byte.
 * Di tahap development, jika env tidak diset, data dilewatkan apa adanya (plain).
 */
function getKey(): Buffer | null {
  if (!KEY_HEX || KEY_HEX.length < 64) return null;
  return Buffer.from(KEY_HEX, "hex");
}

// =============================================================================
// ENKRIPSI & DEKRIPSI AES-256-GCM
// =============================================================================

/**
 * Enkripsi teks sensitif (NIK / No KK) menjadi format: iv:authTag:ciphertext
 * Jika PII_ENCRYPTION_KEY tidak diset, kembalikan plain text (aman untuk dev).
 */
export function encryptPII(plainText: string): string {
  if (!plainText) return plainText;
  const key = getKey();
  if (!key) return plainText; // Development mode: skip encryption

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Dekripsi ciphertext kembali ke plain text.
 * Jika teks bukan format ciphertext (misal data legacy plain text), dikembalikan apa adanya.
 */
export function decryptPII(cipherText: string): string {
  if (!cipherText) return cipherText;
  // Jika bukan format ciphertext enkripsi (tidak mengandung 2 tanda ':'), kembalikan as-is
  const parts = cipherText.split(":");
  if (parts.length !== 3) return cipherText;

  const key = getKey();
  if (!key) return cipherText; // Development mode: no key, return as-is

  try {
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    // Gagal dekripsi (mungkin data lama / plain text) — kembalikan apa adanya
    return cipherText;
  }
}

// =============================================================================
// BLIND INDEX (HMAC-SHA256 untuk pencarian & UNIQUE constraint)
// =============================================================================

/**
 * Hasilkan HMAC-SHA256 dari NIK / No KK untuk digunakan sebagai blind index.
 * Digunakan untuk pencarian exact-match dan validasi UNIQUE constraint.
 */
export function hashPII(plainText: string): string {
  if (!plainText) return "";
  return crypto
    .createHmac("sha256", SALT)
    .update(plainText.trim())
    .digest("hex");
}

// =============================================================================
// DYNAMIC MASKING (In-Memory, tidak disimpan di database)
// =============================================================================

/**
 * Sensor tampilan NIK secara dinamis.
 * Format: 6 digit depan + ****** + 4 digit belakang
 * Contoh: "3201012304900001" → "320101******0001"
 */
export function maskNIK(nik: string): string {
  if (!nik || nik.length < 10) return "****************";
  return `${nik.slice(0, 6)}******${nik.slice(-4)}`;
}

/**
 * Sensor tampilan Nomor Kartu Keluarga secara dinamis.
 * Format: 6 digit depan + ****** + 4 digit belakang
 * Contoh: "3201012304900005" → "320101******0005"
 */
export function maskFamilyNumber(familyNumber: string): string {
  if (!familyNumber || familyNumber.length < 10) return "****************";
  return `${familyNumber.slice(0, 6)}******${familyNumber.slice(-4)}`;
}

/**
 * Helper: Cek apakah enkripsi PII aktif (env key tersedia).
 * Berguna untuk skrip migrasi dan diagnostic.
 */
export function isPIIEncryptionActive(): boolean {
  return KEY_HEX.length >= 64;
}
