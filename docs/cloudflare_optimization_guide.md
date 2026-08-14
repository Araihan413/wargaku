# Panduan Lengkap Implementasi & Optimasi Cloudflare (Free Tier) — Wargaku

Dokumen ini berisi panduan komprehensif langkah-demi-langkah (*step-by-step*) untuk mengintegrasikan dan mengoptimalkan **Cloudflare Free Tier** pada sistem **Wargaku** (Next.js 16, MySQL, Better-Auth, Cloudinary, Leaflet).

---

## Daftar Isi
1. [Tahap 1: Konfigurasi DNS & SSL/TLS Dasar](#tahap-1-konfigurasi-dns--ssltls-dasar)
2. [Tahap 2: Keamanan & WAF Edge Protection](#tahap-2-keamanan--waf-edge-protection)
3. [Tahap 3: Penyesuaian Kode Aplikasi (Backend Alignment)](#tahap-3-penyesuaian-kode-aplikasi-backend-alignment)
   - [3.1 Helper Resolusi IP Asli (`CF-Connecting-IP`)](#31-helper-resolusi-ip-asli-cf-connecting-ip)
   - [3.2 Helper & Endpoint Verifikasi Cloudflare Turnstile](#32-helper--endpoint-verifikasi-cloudflare-turnstile)
4. [Tahap 4: Optimasi Performa & Edge Caching](#tahap-4-optimasi-performa--edge-caching)
5. [Tahap 5: Fitur Tambahan (Email Routing & Notifikasi)](#tahap-5-fitur-tambahan-email-routing--notifikasi)
6. [Tahap 6: Checklist & Troubleshooting Produksi](#tahap-6-checklist--troubleshooting-produksi)

---

## Tahap 1: Konfigurasi DNS & SSL/TLS Dasar

### 1.1 Penambahan Domain & DNS
1. Daftarkan akun di [Cloudflare Dashboard](https://dash.cloudflare.com/) dan pilih **Add a Site** (masukkan nama domain Anda, misal: `wargaku.id`).
2. Pilih paket **Free Tier ($0)**.
3. Ubah **Nameserver** di registrar domain Anda (misal: Niagahoster, Domainesia, Namecheap, Cloudkilat) sesuai 2 nameserver yang diberikan Cloudflare.
4. Pada menu **DNS > Records**:
   * Tambahkan `A Record` untuk `@` (root) mengarah ke IP Server VPS / Hosting Anda.
   * Pastikan **Proxy status** bernilai **Proxied (Orange Cloud ☁️)** agar semua fitur keamanan dan CDN aktif.

### 1.2 Konfigurasi SSL/TLS (Anti Man-in-the-Middle)
Masuk ke menu **SSL/TLS**:
1. **SSL/TLS encryption mode**: Pilih **Full (Strict)**.
   > ⚠️ **Catatan Penting**: Jangan gunakan mode *Flexible* karena komunikasi dari Cloudflare ke server backend Anda tidak terenkripsi. Buat sertifikat SSL gratis di server origin (Let's Encrypt / Certbot atau Cloudflare Origin CA).
2. **Edge Certificates**:
   * Aktifkan **Always Use HTTPS** (`ON`).
   * Aktifkan **Automatic HTTPS Rewrites** (`ON`).
   * Aktifkan **Minimum TLS Version**: `TLS 1.2` (standar keamanan modern).
   * Aktifkan **Opportunistic Encryption** (`ON`).
   * Aktifkan **HTTP Strict Transport Security (HSTS)**:
     * *Max-Age*: `6 months` atau `1 year`.
     * *Include subdomains*: `ON`.
     * *Preload*: `ON`.

---

## Tahap 2: Keamanan & WAF Edge Protection

### 2.1 WAF Geo-Blocking (Hanya Izinkan Akses Indonesia)
Karena aplikasi Wargaku ditujukan khusus untuk warga lokal di lingkup RT/RW:
1. Masuk ke **Security > WAF > Custom Rules > Create Rule**.
2. **Rule Name**: `Allow Indonesia Only & Block Foreign Bots`
3. **Field Configuration**:
   * **Field**: `Country` (`ip.geoip.country`)
   * **Operator**: `does not equal`
   * **Value**: `Indonesia` (ID)
4. **Action**: Pilih **Managed Challenge** (atau `Block` jika ingin langsung memutus akses dari luar negeri).
5. Klik **Deploy**.

> 💡 **Manfaat**: Menghilangkan 95%+ serangan brute-force, vulnerability scanner, dan bot liar otomatis dari luar negeri sebelum request mencapai server Anda.

### 2.2 Bot Fight Mode & DDoS Protection
1. Masuk ke **Security > Bots**.
2. Aktifkan **Bot Fight Mode** (`ON`).
3. Masuk ke **Security > DDoS** (Pengaturan default Free Tier sudah aktif dan secara otomatis meredam serangan Layer 3, 4, dan 7).

---

## Tahap 3: Penyesuaian Kode Aplikasi (Backend Alignment)

### 3.1 Helper Resolusi IP Asli (`CF-Connecting-IP`)
Saat aplikasi berada di balik proxy Cloudflare, header IP yang paling akurat adalah `CF-Connecting-IP`. 

Buat file helper terpusat di `lib/client-ip.ts`:

```ts
// file: lib/client-ip.ts
import { headers } from 'next/headers';

/**
 * Mengambil IP asli pengunjung secara akurat, mendukung Cloudflare Proxy, reverse proxy standar, dan local development.
 */
export async function getClientIp(): Promise<string> {
  const reqHeaders = await headers();
  
  // 1. Prioritas Utama: Header resmi Cloudflare
  const cfIp = reqHeaders.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  // 2. Standard Forwarded For (ambil IP pertama)
  const forwardedFor = reqHeaders.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  // 3. Fallback Header Nginx/Reverse Proxy
  const realIp = reqHeaders.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}
```

Implementasikan helper ini pada endpoint yang membutuhkan rate limit (misal: `app/api/complaints/route.ts`):

```diff
- const forwarded = reqHeaders.get('x-forwarded-for');
- const clientIp = forwarded ? forwarded.split(',')[0].trim() : reqHeaders.get('x-real-ip') || '127.0.0.1';
+ const clientIp = await getClientIp();
```

---

### 3.2 Helper & Endpoint Verifikasi Cloudflare Turnstile

Frontend Anda di `app/(public)/lapor/page.tsx` sudah mengirimkan `turnstileToken`. Backend wajib memverifikasi token ini ke Cloudflare.

#### A. Tambahkan Environment Variable di `.env`
```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAAA..." # Site Key dari Cloudflare Dashboard
TURNSTILE_SECRET_KEY="0x4AAAAAA..."           # Secret Key (Private, jangan bocorkan ke frontend)
```

#### B. Buat Helper Verifikasi di `lib/turnstile.ts`
```ts
// file: lib/turnstile.ts
interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

/**
 * Memvalidasi token Cloudflare Turnstile ke API Cloudflare Siteverify.
 */
export async function verifyTurnstileToken(token: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Jika environment variable belum diatur di masa development, lewati verifikasi dengan warning
  if (!secretKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Turnstile Warning] TURNSTILE_SECRET_KEY belum disetel di .env, verifikasi dilewati (Dev Mode).');
      return { success: true };
    }
    return { success: false, error: 'Konfigurasi Turnstile server belum lengkap.' };
  }

  if (!token) {
    return { success: false, error: 'Token CAPTCHA / Turnstile tidak ditemukan.' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp && remoteIp !== '127.0.0.1') {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const data: TurnstileVerifyResponse = await response.json();

    if (!data.success) {
      console.warn('[Turnstile Failed]', data['error-codes']);
      return { 
        success: false, 
        error: 'Verifikasi keamanan bot gagal. Silakan muat ulang halaman dan coba lagi.' 
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error('[Turnstile Error]', err);
    return { success: false, error: 'Terjadi gangguan saat memverifikasi keamanan CAPTCHA.' };
  }
}
```

#### C. Sambungkan ke Handler `app/api/complaints/route.ts`
```ts
// Di dalam POST handler /api/complaints:
const body = await request.json();
const { reporterName, reporterPhone, category, description, photoPath, dwellingId, turnstileToken } = body;

// Verifikasi Keamanan Turnstile (Anti-Spam Bot)
const turnstileCheck = await verifyTurnstileToken(turnstileToken, clientIp);
if (!turnstileCheck.success) {
  return NextResponse.json({ error: turnstileCheck.error }, { status: 400 });
}
```

---

## Tahap 4: Optimasi Performa & Edge Caching

### 4.1 Cache Rules untuk Aset Statis Next.js & Font
Aset JavaScript, CSS, dan Font pada Next.js di-generate dengan hash nama unik sehingga aman di-cache dalam jangka waktu lama.

1. Masuk ke **Caching > Cache Rules > Create Rule**.
2. **Rule Name**: `Cache Next.js Static Assets & Fonts`
3. **Expression**:
   * `(http.request.uri.path starts_with "/_next/static/") or (http.request.uri.path starts_with "/images/") or (http.request.uri.path contains ".woff2")`
4. **Cache settings**:
   * **Cache Eligibility**: `Eligible for cache`
   * **Edge TTL**: `Override origin` -> `1 month`
   * **Browser TTL**: `Override origin` -> `1 month`
5. Klik **Deploy**.

### 4.2 Aktifkan Kompresi & Protokol Modern
Masuk ke menu **Speed > Optimization**:
1. **Brotli**: Aktifkan (`ON`). Kompresi teks hingga 20% lebih padat dari Gzip.
2. **Early Hints (HTTP 103)**: Aktifkan (`ON`). Memerintahkan browser mengunduh CSS/JS krusial saat Next.js masih memproses SSR.
3. **HTTP/3 (with QUIC)**: Masuk ke **Network > HTTP/3** -> Aktifkan (`ON`). Sangat mempercepat loading di koneksi seluler/smartphone warga.
4. **0-RTT Connection Resumption**: Aktifkan (`ON`).
5. **Tiered Cache**: Masuk ke **Caching > Configuration > Tiered Cache** -> Aktifkan `Smart Tiered Cache (Argos)`.

---

## Tahap 5: Fitur Tambahan (Email Routing & Notifikasi)

Bagi pengurus RT/RW, memiliki email resmi domain (misal: `pengurus@wargaku.id` atau `lapor@wargaku.id`) meningkatkan kredibilitas tanpa perlu membayar akun Google Workspace berbayar.

### Cara Konfigurasi Cloudflare Email Routing:
1. Masuk ke menu **Email > Email Routing**.
2. Masukkan alamat email tujuan (misal: akun Gmail pribadi Ketua RT `ketuart01@gmail.com`).
3. Buka kotak masuk Gmail dan klik tautan konfirmasi verifikasi dari Cloudflare.
4. Buat **Custom Address**:
   * *Custom address*: `pengurus@wargaku.id` (atau `kontak@wargaku.id`)
   * *Action*: `Send to`
   * *Destination*: `ketuart01@gmail.com`
5. Cloudflare akan otomatis menambahkan MX Record dan SPF/DKIM DNS record yang dibutuhkan.

---

## Tahap 6: Checklist & Troubleshooting Produksi

### Checklist Kesiapan Deploy
- [ ] Mode SSL di Cloudflare diset ke **Full (Strict)**.
- [ ] WAF Rule Geo-blocking Indonesia sudah aktif.
- [ ] `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan `TURNSTILE_SECRET_KEY` terisi di file `.env.production`.
- [ ] Endpoint `/api/complaints` memvalidasi Turnstile token di server.
- [ ] Helper `getClientIp` membaca `cf-connecting-ip`.
- [ ] Cache rule `/_next/static/*` aktif dan terverifikasi di Network tab (`cf-cache-status: HIT`).

### Panduan Purge Cache Saat Rilis Versi Baru
Jika setelah deploy update aplikasi terdapat tampilan UI yang belum berubah:
1. Buka **Caching > Configuration**.
2. Pada bagian **Purge Cache**, klik **Purge Everything** (atau purge URL spesifik).
