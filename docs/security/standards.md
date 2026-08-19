# Standar Keamanan & Panduan Audit Sistem (Security Standards)
*Sistem Informasi Wargaku*

Dokumen ini memuat standar keamanan teknis, prinsip perlindungan data pribadi (UU PDP No. 27/2022), matriks mitigasi ancaman, dan prosedur audit keamanan bagi pengembang.

---

## 1. Perlindungan Data Pribadi (UU PDP & PII Data Masking)

Sistem wajib melindungi data kependudukan sensitif (*Personally Identifiable Information*) dari kebocoran antarwarga maupun pihak luar:

1. **Penyensoran NIK (*National ID Masking*):**
   * Format Sensor: `320**********123` (Hanya 3 digit awal dan 3 digit akhir yang tampak bagi publik / sesama warga).
   * Format Lengkap: Hanya dapat diakses oleh **Kepala Keluarga pemilik data**, **Ketua RT**, dan **Super Admin**.
2. **Penyensoran Nomor Telepon / WhatsApp:**
   * Format Sensor: `08*******890` (Hanya awalan `08` dan 3 digit akhir yang tampak pada fitur pencarian warga).
3. **Penyimpanan Dokumen Sensitif (Scan KK / KTP):**
   * Seluruh dokumen scan KK dan KTP disimpan sebagai berkas privat (*authenticated asset*) di Cloudinary.
   * Pengunduhan atau pratinjau berkas wajib melalui endpoint proxy server bertanda tangan waktu (*timed signed URL*) dan divalidasi sesi pengguna.

---

## 2. Standar Autentikasi, Hak Akses (RBAC) & Secret Keys

1. **Pengelolaan Kunci Rahasia (*Secret Management*):**
   * Kunci rahasia backend (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `CLOUDINARY_API_SECRET`, `BREVO_API_KEY`, `TURNSTILE_SECRET_KEY`) **dilarang keras** menggunakan prefiks `NEXT_PUBLIC_`.
   * Hanya variabel publik yang boleh memakai `NEXT_PUBLIC_` (misal: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
2. **Proteksi Password:**
   * Password di-hash menggunakan algoritma modern (**Scrypt / Argon2**) via Better Auth.
   * Password hash wajib di-exclude dari seluruh response API frontend (`password: undefined`).
3. **Cookie Sesi Aman:**
   * Sesi web menggunakan atribut: `HttpOnly = true`, `SameSite = Lax`, dan `Secure = true` pada lingkungan produksi HTTPS.
4. **Proteksi OpenAPI / Swagger di Produksi:**
   * Endpoint Swagger UI (`/api-docs`) dan OpenAPI JSON (`/api/openapi`) otomatis dinonaktifkan (`404 Not Found`) pada lingkungan produksi (`NODE_ENV === 'production'`).

---

## 3. Matriks Mitigasi Ancaman (Threat Matrix)

| Kategori Ancaman | Risiko | Mekanisme Pencegahan di Kode Wargaku |
| :--- | :--- | :--- |
| **Insecure Direct Object Reference (IDOR)** | User A memanipulasi ID URL/payload untuk mengedit KK atau kos milik User B | Backend memvalidasi `session.user.familyId === targetFamilyId` atau `session.user.id === property.ownerUserId` sebelum eksekusi mutasi database. |
| **SQL Injection (SQLi)** | Injeksi query berbahaya lewat input pencarian | Menggunakan **Drizzle ORM** dengan parameterized queries dan prepared statements. Dilarang konkatenasi string SQL mentah. |
| **Malicious File Upload** | Upload malware / shell script berkedok foto KTP | Whitelist MIME Type ketat (`image/jpeg`, `image/png`, `application/pdf`), batas ukuran maks 2MB, dan sanitasi nama file unik. |
| **Automated Spam / Bot Attack** | Spam laporan aduan publik massal | Integrasi **Cloudflare Turnstile CAPTCHA** pada form publik (`/lapor`) dan pembatasan frekuensi (*Rate Limiting*). |

---

## 4. Perintah Audit Keamanan & Pengujian (Security CLI)

Sebelum melakukan commit, pull request, atau rilis ke VPS produksi, jalankan perintah pengujian keamanan berikut:

```bash
# 1. Menjalankan seluruh pengujian keamanan endpoint & PII masking
npm run test:security

# 2. Memindai 96 API Route terhadap celah auth guard dan mutasi Zod
npm run audit:endpoints

# 3. Menjalankan audit menyeluruh (Scan API + Security Tests)
npm run security:all

# 4. Memeriksa kerentanan paket dependensi npm
npm audit
```
