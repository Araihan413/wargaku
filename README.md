<div align="center">

# WargaKu
### Sistem Informasi Pengelolaan RT/RW

**WargaKu** adalah platform digital berbasis web untuk modernisasi tata kelola administrasi Rukun Tetangga (RT).
Dirancang untuk pengurus RT dan warga, sistem ini mengintegrasikan data kependudukan, keuangan, komunikasi, hingga pengaduan dalam satu dashboard yang aman dan transparan.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-green)](https://orm.drizzle.team)
[![MySQL](https://img.shields.io/badge/MySQL-8%2B-orange?logo=mysql)](https://mysql.com)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/Lisensi-Privat-red)](LICENSE)

</div>

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Tech Stack](#tech-stack)
- [Struktur Proyek](#struktur-proyek)
- [Desain Database](#desain-database)
- [Autentikasi dan RBAC](#autentikasi-dan-rbac)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi dan Setup](#instalasi-dan-setup)
- [Konfigurasi Environment](#konfigurasi-environment)
- [Perintah Tersedia](#perintah-tersedia)
- [API Endpoints](#api-endpoints)
- [Pengujian Testing](#pengujian-testing)
- [Keamanan dan Privasi Data](#keamanan-dan-privasi-data)
- [Panduan Kontribusi](#panduan-kontribusi)
- [Roadmap](#roadmap)

---

## Tentang Proyek

Pengelolaan administrasi RT/RW secara konvensional (buku catatan, spreadsheet terpisah) menghadapi banyak keterbatasan: data kependudukan rentan hilang, pembukuan kas kurang transparan, keluhan warga tidak terlacak, serta pemantauan hunian sewa yang tidak tertib.

**WargaKu** hadir sebagai solusi digital terpadu yang:

- **Memusatkan data kependudukan** — KK, warga tetap, hingga penghuni kos/kontrakan dalam satu basis data terstruktur.
- **Memastikan transparansi keuangan** — Pencatatan kas masuk & keluar, tagihan iuran, dan laporan resmi yang dapat dicetak.
- **Memfasilitasi komunikasi** — Pengumuman resmi, kalender kegiatan, dan siaran notifikasi sistem.
- **Membuka kanal pengaduan** — Formulir publik tanpa login dengan pelacakan kode instan dan alur respon terstruktur.
- **Memantau hunian sewa** — Panel koordinator kos/kontrakan untuk check-in, check-out, dan kapasitas kamar.

---

## Fitur Utama

### Autentikasi dan Manajemen Akun

- Login berbasis email dan password (Better Auth)
- Dua alur registrasi: dibuatkan pengurus atau pendaftaran mandiri warga
- Verifikasi email dan aktivasi akun
- Reset password melalui email transaksional (Brevo)
- Role Switcher (Dual-Role) di Navbar untuk pengurus multi-peran

### Manajemen Pengguna dan RBAC

- 6 role sistem: Super Admin, Ketua RT, Sekretaris, Bendahara, Koordinator Kost, Warga
- 24 permission yang dapat dikonfigurasi secara dinamis per role
- Matriks otorisasi hak akses melalui panel Super Admin
- Suspend, mutasi peran, dan reset password sementara

### Kependudukan dan Hunian

- CRUD data Kartu Keluarga (KK) dengan verifikasi berkas
- Pendaftaran anggota keluarga (warga tetap) dengan NIK terenkripsi
- Manajemen hunian fisik (rumah, kos, homestay)
- Alur perubahan data KK dengan approval Ketua RT
- QR Code unik per hunian untuk identifikasi dan pencetakan massal

### Keuangan dan Iuran

- Pencatatan kas masuk & keluar RT dengan bukti nota digital
- Pembuatan aturan tarif iuran warga yang fleksibel
- Generate tagihan on-demand dan pencatatan setoran (lunas/cicil)
- Laporan Keuangan resmi dengan ekspor ke PDF berkop RT

### Komunikasi dan Partisipasi

- Pengumuman warga dengan kategorisasi dan fitur pin
- Kalender agenda kegiatan lingkungan
- Siaran notifikasi sistem ke seluruh pengguna (System Broadcasts)
- Notifikasi personal dan dinas berbasis in-app

### Pengaduan Warga Publik

- Formulir aduan publik tanpa login, dilindungi Cloudflare Turnstile CAPTCHA
- Rate limiting otomatis untuk mencegah spam
- Kode pelacakan instan untuk memantau status
- Alur respon terstruktur: Menunggu -> Proses -> Selesai / Ditolak

### Properti Sewa Kos dan Kontrakan

- Panel koordinator sewa dengan manajemen kapasitas kamar
- Check-in penyewa perorangan maupun keluarga
- Verifikasi berkas KTP penyewa
- Pemrosesan check-out dan riwayat kontrak

### Kelompok Warga Smart Groups

- Filter data warga multi-kriteria (CitizenFilterBar)
- Penyimpanan preset filter favorit
- Ekspor daftar warga ke CSV/Excel

### Audit dan Keamanan

- Audit trail lengkap: aktivitas pengguna, modul, deskripsi, dan IP Address
- Enkripsi data PII (NIK dan Nomor KK) dengan AES-256-GCM sesuai UU PDP No. 27/2022
- Blind Index HMAC-SHA256 untuk pencarian exact-match data sensitif
- Scanner keamanan endpoint API otomatis

---

## Arsitektur Sistem

```
+---------------------------------------------------------------+
|                        Browser / Client                       |
|              React 19 + TailwindCSS 4 + Zustand              |
+----------------------------+---------------------------------+
                             | HTTPS
+----------------------------v---------------------------------+
|                     Next.js 16 (App Router)                  |
|  +------------------+  +--------------+  +---------------+  |
|  |  Route Handlers  |  | Server Actions|  |  Middleware   |  |
|  |  (API Endpoints) |  | (Form Submit) |  |  (Auth Guard) |  |
|  +--------+---------+  +------+-------+  +---------------+  |
|           |                   |                              |
|  +--------v-------------------v----------------------------+ |
|  |              Business Logic & Lib Layer                 | |
|  |  Better Auth | Drizzle Queries | RBAC | Crypto-PII      | |
|  |  Cloudinary  | Mail (Brevo)    | Notif| Audit Logger    | |
|  +------------------------------+--------------------------+ |
+------------------------------+-------------------------------+
                               |
+------------------------------v--------------+
|              MySQL 8+ Database              |
|     Drizzle ORM (Schema-first, Type-safe)   |
+---------------------------------------------+
                               |
         +---------------------+-----------------+
         v                     v                 v
   Cloudinary CDN         Brevo (Email)     Cloudflare
  (Upload Media)      (Transactional Mail) (Turnstile CAPTCHA)
```

**Pola komunikasi:**

- **Server Components** digunakan untuk rendering data statis yang di-cache.
- **Client Components** (`"use client"`) hanya digunakan untuk interaktivitas: form, modal, dropdown, grafik.
- **API Routes** (`/app/api/`) menangani semua mutasi data, diproteksi oleh middleware autentikasi.
- **Zustand** digunakan sebagai state manager global (notifikasi unread, broadcast aktif).

---

## Tech Stack

| Kategori | Teknologi | Versi | Keterangan |
|:---|:---|:---|:---|
| Framework | Next.js | ^16.3 | App Router, React Server Components |
| Language | TypeScript | ^5 | Strict mode, path alias `@/*` |
| UI Library | React | 19.2.4 | Concurrent Mode |
| Styling | TailwindCSS | ^4 | Custom design system |
| ORM | Drizzle ORM | ^0.45 | Schema-first, type-safe query builder |
| Database | MySQL | 8+ | Relational, ACID-compliant |
| Auth | Better Auth | ^1.6 | Session-based, email/password |
| Validasi | Zod | ^4.4 | Runtime type validation |
| Form | React Hook Form | ^7.81 | Controlled forms dengan resolver Zod |
| State | Zustand | ^5.0 | Global state management |
| Icon | Lucide React | ^1.24 | Konsisten SVG icons |
| Toast | Sonner | ^2.0 | Notifikasi in-app |
| Grafik | Recharts | ^3.9 | Chart keuangan & statistik |
| Peta | Leaflet + react-leaflet | ^1.9 + ^5 | Peta lokasi hunian |
| QR Code | qrcode + qr-scanner | ^1.5 + ^1.4 | Generate & scan QR Code |
| PDF | jsPDF + html-to-image | ^4.2 + ^1.11 | Ekspor laporan PDF |
| Upload | Cloudinary SDK | ^2.10 | Cloud storage media |
| Email | Brevo (Sendinblue) | Custom | Transactional email |
| CAPTCHA | Cloudflare Turnstile | ^1.5 | Anti-bot form publik |
| Testing | Vitest | ^4.1 | Unit & integration test |
| Linting | ESLint | ^9 | eslint-config-next |
| DB Tools | Drizzle Kit | ^0.31 | Migration & push schema |

---

## Struktur Proyek

```
wargaku/
+-- app/                          # Next.js App Router
|   +-- (auth)/                   # Grup rute autentikasi (Login, Register)
|   +-- (public)/                 # Halaman publik (Landing, Pengaduan, Pelacakan)
|   +-- _components/              # Komponen layout global (Navbar Publik)
|   +-- activate-account/         # Halaman aktivasi akun via email
|   +-- api/                      # API Route Handlers
|   |   +-- auth/                 #   Better Auth handlers
|   |   +-- dwellings/            #   CRUD hunian fisik
|   |   +-- families/             #   CRUD Kartu Keluarga
|   |   +-- family-members/       #   CRUD anggota keluarga
|   |   +-- cash-transactions/    #   CRUD kas RT
|   |   +-- fee-rules/            #   Aturan tarif iuran
|   |   +-- fee-payments/         #   Pencatatan setoran iuran
|   |   +-- complaints/           #   Pengaduan warga (publik & dashboard)
|   |   +-- announcements/        #   Pengumuman
|   |   +-- notifications/        #   Notifikasi
|   |   +-- rental-properties/    #   Properti sewa (kos/kontrakan)
|   |   +-- rental-contracts/     #   Kontrak penyewa
|   |   +-- qr-codes/             #   Generate & validasi QR Code
|   |   +-- users/                #   Manajemen pengguna
|   |   +-- permissions/          #   Matriks RBAC
|   |   +-- audit-logs/           #   Log aktivitas
|   |   +-- smart-groups/         #   Filter preset warga
|   |   +-- reports/              #   Laporan keuangan
|   |   +-- upload/               #   Upload file (Cloudinary)
|   |   +-- openapi/              #   Spesifikasi OpenAPI/Swagger
|   +-- api-docs/                 # Halaman Swagger UI
|   +-- dashboard/                # Dashboard utama (protected)
|   |   +-- page.tsx              #   Halaman beranda dashboard
|   |   +-- layout.tsx            #   Layout sidebar + navbar dashboard
|   |   +-- _components/          #   Komponen layout dashboard (Sidebar, Navbar)
|   |   +-- residents/            #   Modul kependudukan (KK, warga, hunian)
|   |   +-- family/               #   Data keluarga warga (self-service)
|   |   +-- cash/                 #   Modul keuangan kas RT
|   |   +-- dues/                 #   Modul iuran warga
|   |   +-- my-fees/              #   Tagihan iuran mandiri warga
|   |   +-- my-properties/        #   Hunian saya (warga)
|   |   +-- rentals/              #   Panel koordinator kos/kontrakan
|   |   +-- complaints/           #   Manajemen pengaduan
|   |   +-- announcements/        #   Pengumuman
|   |   +-- activities/           #   Kalender kegiatan
|   |   +-- notifications/        #   Notifikasi pengguna
|   |   +-- smart-groups/         #   Kelompok warga & filter
|   |   +-- qr-codes/             #   QR Code hunian
|   |   +-- approvals/            #   Persetujuan perubahan KK
|   |   +-- neighborhood/         #   Peta & info lingkungan
|   |   +-- users/                #   Manajemen pengguna (Super Admin)
|   |   +-- permissions/          #   Manajemen RBAC (Super Admin)
|   |   +-- system-config/        #   Konfigurasi identitas RT
|   |   +-- system-broadcast/     #   Siaran notifikasi sistem
|   |   +-- audit-logs/           #   Log aktivitas (Super Admin)
|   |   +-- profile/              #   Profil pengguna
|   +-- unauthorized/             # Halaman 403 Unauthorized
|
+-- components/                   # Komponen UI global (reusable)
|   +-- CustomSelect.tsx          #   Dropdown dengan fitur pencarian
|   +-- AutocompleteInput.tsx     #   Input autocomplete
|   +-- TablePagination.tsx       #   Pagination tabel standar
|   +-- Sidebar.tsx               #   Sidebar dashboard
|
+-- db/                           # Lapisan database
|   +-- schema.ts                 #   Definisi skema Drizzle ORM (seluruh tabel)
|   +-- index.ts                  #   Koneksi database (mysql2 + drizzle)
|   +-- seed.ts                   #   Data awal (roles, permissions, admin)
|   +-- queries/                  #   Query functions per modul
|   +-- migrations/               #   File migrasi SQL (Drizzle Kit)
|
+-- lib/                          # Utilitas & konfigurasi inti
|   +-- auth.ts                   #   Konfigurasi Better Auth (server)
|   +-- auth-client.ts            #   Better Auth client
|   +-- rbac.ts                   #   Helper cek permission RBAC
|   +-- crypto-pii.ts             #   Enkripsi/dekripsi PII (AES-256-GCM)
|   +-- cloudinary.ts             #   Helper upload Cloudinary
|   +-- mail.ts                   #   Helper kirim email (Brevo)
|   +-- notifications.ts          #   Helper buat notifikasi
|   +-- audit-logger.ts           #   Helper catat audit log
|   +-- turnstile.ts              #   Validasi Cloudflare Turnstile
|   +-- date-format.ts            #   Formatter tanggal (Indonesia)
|   +-- download-pdf-helper.ts    #   Helper ekspor PDF laporan
|   +-- config.ts                 #   Konfigurasi aplikasi global
|   +-- constants.ts              #   Konstanta aplikasi
|   +-- validations/              #   Skema Zod per modul
|
+-- hooks/                        # Custom React Hooks
+-- tests/                        # Test suite
|   +-- security/
|   |   +-- api-protection.test.ts
|   +-- workflows/
|       +-- 01-auth-flow.test.ts
|       +-- 02-finance-flow.test.ts
|       +-- 03-family-flow.test.ts
|       +-- 04-rental-flow.test.ts
|
+-- scripts/
|   +-- scan-api-security.ts      # Scanner keamanan endpoint
|   +-- migrate-encrypt-pii.ts    # Migrasi enkripsi data PII lama
|
+-- docs/                         # Dokumentasi tambahan
+-- public/images/                # Aset statis (logo, ikon)
+-- PRD.md                        # Product Requirements Document
+-- AGENTS.md                     # Aturan coding agent
+-- .env.example                  # Contoh variabel environment
```

---

## Desain Database

Database menggunakan MySQL 8+ dengan Drizzle ORM sebagai query builder yang type-safe. Skema terdiri dari **7 modul utama** dengan relasi antar tabel yang terstruktur.

### Tabel-Tabel Utama

#### Modul 1 — Autentikasi dan RBAC

| Tabel | Deskripsi |
|:---|:---|
| `users` | Pengguna sistem (semua role) |
| `roles` | Definisi role (Super Admin, Ketua RT, dll.) |
| `permissions` | Definisi permission per modul |
| `role_permissions` | Many-to-many: role <-> permission |
| `user_roles` | Many-to-many multi-role: user <-> role |
| `sessions`, `accounts`, `verifications` | Tabel internal Better Auth |

#### Modul 2 — Kependudukan dan Hunian

| Tabel | Deskripsi |
|:---|:---|
| `dwellings` | Unit fisik rumah (blok, nomor, tipe, koordinat GPS) |
| `families` | Kartu Keluarga (KK) per hunian |
| `family_members` | Anggota keluarga (NIK terenkripsi) |
| `family_change_requests` | Draft usulan perubahan KK dengan alur approval |
| `rental_properties` | Properti komersial (kos, homestay) |
| `rental_contracts` | Kontrak penyewa (individual/keluarga) |

#### Modul 3 — Keuangan dan Iuran

| Tabel | Deskripsi |
|:---|:---|
| `cash_transactions` | Mutasi kas RT (masuk/keluar, bukti foto) |
| `fee_rules` | Aturan tarif iuran (tetap/persentase, per periode) |
| `fee_invoices` | Tagihan iuran yang di-generate per warga |
| `fee_payments` | Pembayaran iuran (lunas/cicil) |

#### Modul 4 — Komunikasi

| Tabel | Deskripsi |
|:---|:---|
| `announcements` | Pengumuman warga (kategori, pin, status publish) |
| `activities` | Agenda kegiatan lingkungan |
| `system_broadcasts` | Siaran notifikasi sistem global |
| `notifications` | Notifikasi personal per pengguna |

#### Modul 5 — Pengaduan

| Tabel | Deskripsi |
|:---|:---|
| `complaints` | Laporan aduan warga (kode pelacak, status, respon pengurus) |

#### Modul 6 — QR Code

Kolom `qr_token` di tabel `dwellings` menyimpan token QR unik per hunian (UUID, auto-generated).

#### Modul 7 — Audit dan Sistem

| Tabel | Deskripsi |
|:---|:---|
| `audit_logs` | Catatan aktivitas (user, modul, deskripsi, IP) |
| `system_config` | Konfigurasi identitas RT (nama, kontak darurat, logo) |
| `smart_group_presets` | Preset filter kelompok warga tersimpan |

### Diagram Relasi Kunci

```
users ----< user_roles >---- roles ----< role_permissions >---- permissions

dwellings ----< families ----< family_members
          |                +-- family_change_requests
          |                +-- fee_invoices ----< fee_payments
          |
          +----< rental_properties ----< rental_contracts

users ----< notifications
users ----< audit_logs
users ----< cash_transactions
```

### Keamanan Data Sensitif (PII)

Data PII (Personally Identifiable Information) **NIK** dan **Nomor KK** diproteksi berlapis:

1. **Enkripsi di rest** — Nilai disimpan sebagai ciphertext `AES-256-GCM` dengan format `iv:authTag:ciphertext`.
2. **Blind Index** — Kolom `nik_hash` dan `family_number_hash` menyimpan `HMAC-SHA256` dari nilai asli, digunakan untuk constraint `UNIQUE` dan pencarian exact-match tanpa mendekripsi.
3. **Dekripsi on-demand** — Nilai hanya didekripsi saat ditampilkan ke pengguna yang berwenang.

> **Penting:** Fitur enkripsi PII **wajib diaktifkan** sebelum go-live ke server produksi.

---

## Autentikasi dan RBAC

### Better Auth

Sistem autentikasi menggunakan **Better Auth** v1.6 dengan konfigurasi:

- **Provider**: Email + Password
- **Session**: Database sessions (tabel `sessions`)
- **Email Verification**: Wajib sebelum dapat login
- **Password Reset**: Via email (Brevo) dengan link berumur 1 jam

### Role dan Permission

Sistem menggunakan **RBAC dinamis**. Setiap permission dapat diaktifkan/dinonaktifkan per role melalui panel Super Admin tanpa perlu deploy ulang.

#### 6 Role Sistem

| Role | Slug | Deskripsi |
|:---|:---|:---|
| Super Admin | `super-admin` | Akses penuh ke seluruh sistem |
| Ketua RT | `ketua-rt` | Administrasi operasional RT |
| Sekretaris | `sekretaris` | Komunikasi & dokumentasi |
| Bendahara | `bendahara` | Keuangan & laporan |
| Koordinator Kost | `koordinator-kost` | Manajemen hunian sewa |
| Warga | `warga` | Self-service data keluarga |

#### Pengecekan Permission di Kode

Permission dicek menggunakan helper `lib/rbac.ts` di setiap API Route Handler:

```ts
import { checkPermission } from '@/lib/rbac';

const allowed = await checkPermission(session.user.id, 'families.create');
if (!allowed) return new Response('Forbidden', { status: 403 });
```

#### Daftar 24 Permission

| Modul | Permission Slug |
|:---|:---|
| Kependudukan | `residents.view`, `residents.create`, `residents.edit`, `residents.delete` |
| Keuangan | `finance.view`, `finance.create`, `finance.edit`, `finance.delete` |
| Iuran | `dues.view`, `dues.create`, `dues.edit`, `dues.delete` |
| Pengaduan | `complaints.view`, `complaints.respond` |
| Pengumuman | `announcements.view`, `announcements.create`, `announcements.edit` |
| Sewa | `rentals.view`, `rentals.manage` |
| Pengguna | `users.view`, `users.manage` |
| Laporan | `reports.view`, `reports.export` |

---

## Persyaratan Sistem

### Runtime

- **Node.js** >= 20 LTS
- **npm** >= 10
- **MySQL** >= 8.0

### Layanan Eksternal (Wajib)

| Layanan | Kegunaan | Link |
|:---|:---|:---|
| MySQL Server | Database utama | — |
| Cloudinary | Cloud storage media (foto, berkas KK/KTP) | https://cloudinary.com |
| Brevo | Email transaksional (aktivasi, reset password) | https://brevo.com |

### Layanan Eksternal (Opsional)

| Layanan | Kegunaan | Link |
|:---|:---|:---|
| Cloudflare Turnstile | CAPTCHA anti-bot form pengaduan | https://developers.cloudflare.com/turnstile |
| OneSignal | Push notification web | https://onesignal.com |
| Google Drive | Picker file dokumen | https://console.cloud.google.com |

---

## Instalasi dan Setup

### 1. Clone Repository

```bash
git clone https://github.com/Araihan413/wargaku.git
cd wargaku
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

```bash
cp .env.example .env
# Edit .env dengan nilai yang sesuai
```

### 4. Buat Database MySQL

```sql
CREATE DATABASE wargaku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Jalankan Migrasi Schema

```bash
# Development (lebih cepat, langsung push)
npm run db:push

# Production (menggunakan file migrasi)
npm run db:migrate
```

### 6. Isi Data Awal (Seed)

```bash
npm run db:seed
```

> **Catatan:** Akun Super Admin awal menggunakan password dari `DEFAULT_PASSWORD` di `.env`. **Segera ubah setelah login pertama.**

### 7. Jalankan Development Server

```bash
npm run dev
# Buka http://localhost:3000
```

---

## Konfigurasi Environment

### Database

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/wargaku"
```

### Autentikasi (Better Auth)

```env
# Generate: openssl rand -base64 32
BETTER_AUTH_SECRET="your_random_generated_secret_key_here"
BETTER_AUTH_URL="http://localhost:3000"
```

### Konfigurasi Aplikasi

```env
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEFAULT_PASSWORD="wargaku123"
```

### Email Transaksional (Brevo)

```env
BREVO_API_KEY="xkeysib-your_brevo_api_key"
BREVO_SENDER_EMAIL="admin@wargaku.local"
```

> Daftar akun gratis di https://brevo.com lalu buka **Settings -> API Keys**.

### Cloud Storage (Cloudinary)

```env
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

> Daftar akun gratis di https://cloudinary.com lalu buka **Dashboard -> Settings**.

### CAPTCHA Anti-Bot (Cloudflare Turnstile)

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your_turnstile_site_key"
TURNSTILE_SECRET_KEY="your_turnstile_secret_key"
```

### Enkripsi PII — Wajib di Produksi

Sesuai **UU PDP No. 27/2022**, NIK dan Nomor KK wajib dienkripsi.

```env
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
PII_ENCRYPTION_KEY=isi_dengan_64_karakter_hex_acak_32_byte
PII_HASH_SALT=isi_dengan_salt_rahasia_unik_rt_anda
```

> **Peringatan:** Simpan nilai ini dengan sangat aman. Kehilangan encryption key menyebabkan data PII tidak dapat didekripsi.

### Timezone

```env
NEXT_PUBLIC_TIMEZONE=Asia/Jakarta
```

---

## Perintah Tersedia

```bash
# Development
npm run dev               # Server development (http://localhost:3000)
npm run build             # Build untuk produksi
npm run start             # Server produksi

# Database
npm run db:push           # Push schema (development)
npm run db:migrate        # Jalankan migrasi SQL
npm run db:seed           # Isi data awal

# Kualitas Kode
npm run lint              # ESLint

# Testing
npm run test              # Seluruh test suite (Vitest)
npm run test:security     # Test keamanan API saja
npm run test:workflows    # Test alur bisnis saja

# Keamanan
npm run audit:endpoints   # Scan keamanan endpoint API
npm run security:all      # Scan + test:security
```

---

## API Endpoints

Dokumentasi interaktif (Swagger UI) tersedia di `http://localhost:3000/api-docs`.

### Endpoint Publik (Tanpa Autentikasi)

| Method | Endpoint | Deskripsi |
|:---|:---|:---|
| `POST` | `/api/auth/sign-in/email` | Login pengguna |
| `POST` | `/api/auth/sign-up/email` | Registrasi mandiri |
| `POST` | `/api/auth/forget-password` | Permintaan reset password |
| `POST` | `/api/auth/reset-password` | Reset password dengan token |
| `GET` | `/api/public/neighborhood` | Info lingkungan (publik) |
| `POST` | `/api/complaints` | Kirim laporan pengaduan |
| `GET` | `/api/complaints/track` | Lacak status pengaduan |

### Endpoint Terproteksi (Butuh Login)

| Method | Endpoint | Modul |
|:---|:---|:---|
| `GET/POST` | `/api/dwellings` | Hunian fisik |
| `GET/POST` | `/api/families` | Kartu Keluarga |
| `GET/POST` | `/api/family-members` | Anggota keluarga |
| `GET/POST` | `/api/cash-transactions` | Kas RT |
| `GET/POST` | `/api/fee-rules` | Aturan iuran |
| `GET/POST` | `/api/fee-payments` | Pembayaran iuran |
| `GET/POST` | `/api/announcements` | Pengumuman |
| `GET/POST` | `/api/notifications` | Notifikasi |
| `GET/POST` | `/api/rental-properties` | Properti sewa |
| `GET/POST` | `/api/rental-contracts` | Kontrak penyewa |
| `GET/POST` | `/api/qr-codes` | QR Code hunian |
| `GET/POST` | `/api/users` | Manajemen pengguna |
| `GET/POST` | `/api/permissions` | Manajemen RBAC |
| `GET` | `/api/audit-logs` | Log aktivitas |
| `GET` | `/api/reports` | Laporan keuangan |
| `POST` | `/api/upload` | Upload file |

---

## Pengujian Testing

### Menjalankan Test

```bash
npm run test              # Semua test
npm run test:security     # Hanya test keamanan
npm run test:workflows    # Hanya test alur bisnis
```

### Struktur Test

```
tests/
+-- security/
|   +-- api-protection.test.ts    # Validasi proteksi 401/403 endpoint
+-- workflows/
    +-- 01-auth-flow.test.ts       # Alur login, registrasi, aktivasi
    +-- 02-finance-flow.test.ts    # Alur pencatatan kas & iuran
    +-- 03-family-flow.test.ts     # Alur pendataan KK & warga
    +-- 04-rental-flow.test.ts     # Alur check-in/out kos
```

### Test Keamanan API

File `tests/security/api-protection.test.ts` memvalidasi bahwa:

- Seluruh endpoint yang butuh autentikasi mengembalikan `401` jika tidak ada session.
- Endpoint dengan pembatasan role mengembalikan `403` untuk role yang salah.
- Tidak ada endpoint sensitif yang dapat diakses tanpa permission yang tepat.

Gunakan `npm run audit:endpoints` untuk scan statis seluruh route handler secara otomatis.

### Test Alur Bisnis

Test `workflows/` mensimulasikan skenario end-to-end:

- **Auth Flow** — Registrasi, verifikasi email, login, logout, reset password.
- **Finance Flow** — Tambah kas masuk, buat tagihan iuran, bayar iuran, generate laporan.
- **Family Flow** — Daftarkan KK baru, tambah anggota, ajukan perubahan data, verifikasi.
- **Rental Flow** — Buat properti kos, check-in penyewa, check-out penyewa.

---

## Keamanan dan Privasi Data

### Enkripsi Data PII

Data identitas sensitif warga dilindungi sesuai **UU Pelindungan Data Pribadi No. 27/2022**:

| Data | Perlakuan |
|:---|:---|
| NIK (KTP) | Enkripsi AES-256-GCM, blind index HMAC-SHA256 |
| Nomor KK | Enkripsi AES-256-GCM, blind index HMAC-SHA256 |
| NIK Penyewa | Enkripsi AES-256-GCM, blind index HMAC-SHA256 |
| Foto KTP/KK | Upload ke Cloudinary private (signed URL) |
| Foto Profil | Upload ke Cloudinary public CDN |

Implementasi tersedia di `lib/crypto-pii.ts`.

### Proteksi Endpoint API

- Semua route handler memvalidasi session sebelum eksekusi.
- Permission dicek per endpoint menggunakan `lib/rbac.ts`.
- Audit log otomatis tercatat untuk setiap mutasi data sensitif.

### Anti-Bot dan Rate Limiting

- Form pengaduan publik dilindungi **Cloudflare Turnstile** CAPTCHA.
- Rate limiting diterapkan pada endpoint pengaduan publik.

### Keamanan File Upload

- Hanya format file yang diizinkan: PDF, JPG, PNG.
- Ukuran file dibatasi per jenis upload.
- File dikirim langsung ke Cloudinary, tidak disimpan di server lokal.
- File sensitif (KTP, KK) diunggah ke folder private Cloudinary.

### Migrasi Data PII Lama

Untuk mengenkripsi data yang ada sebelum fitur ini aktif:

```bash
npx tsx scripts/migrate-encrypt-pii.ts
```

> **Peringatan:** Jalankan hanya sekali setelah `PII_ENCRYPTION_KEY` diisi. Buat backup database terlebih dahulu.

---

## Panduan Kontribusi

### Konvensi Kode

Proyek mengikuti aturan di `AGENTS.md`:

1. **Komponen halaman-spesifik** — Taruh di `_components/` dalam direktori route yang menggunakannya, bukan di `/components` global kecuali dipakai di banyak halaman.
2. **Form & Input** — Gunakan `CustomSelect` (bukan `<select>` HTML) dan `AutocompleteInput` untuk input pencarian. Label `text-sm font-semibold`, field wajib ditandai `*` merah.
3. **Skeleton Loading** — Ikuti standar: `bg-gray-card border border-gray-border rounded-2xl` untuk card, `bg-gray-border/80 rounded-xl` untuk placeholder teks.
4. **Prinsip YAGNI** — Pilih solusi paling sederhana. Hindari `useMemo` yang tidak perlu dan abstraksi prematur.

### Workflow Development

```bash
git checkout -b feat/nama-fitur   # Buat branch fitur
# ... kerjakan perubahan ...
npm run lint                       # Cek linting (wajib)
npm run test                       # Jalankan test
git commit -m "feat: deskripsi"   # Commit (Bahasa Indonesia)
git push origin feat/nama-fitur   # Push
```

### Format Pesan Commit

```
<type>: <deskripsi singkat dalam Bahasa Indonesia>

feat     - Fitur baru
fix      - Perbaikan bug
refactor - Refactoring tanpa perubahan fungsionalitas
style    - Perubahan tampilan/CSS
docs     - Perubahan dokumentasi
test     - Penambahan/perbaikan test
chore    - Konfigurasi, dependency, tooling
```

---

## Roadmap

### Sudah Selesai (v0.1)

- [x] Autentikasi & RBAC (6 role, 24 permission dinamis)
- [x] Manajemen Pengguna (CRUD, suspend, reset password sementara)
- [x] Kependudukan: CRUD KK, anggota keluarga, hunian fisik
- [x] Alur perubahan KK dengan approval Ketua RT
- [x] Keuangan: kas RT, aturan iuran, tagihan, pembayaran
- [x] Laporan keuangan PDF berkop RT
- [x] Pengaduan warga publik + kode pelacakan instan
- [x] Pengumuman & kalender kegiatan
- [x] Notifikasi internal (personal & dinas)
- [x] Siaran sistem (System Broadcasts)
- [x] Properti sewa: kos/kontrakan, check-in/out penyewa
- [x] QR Code hunian + cetak massal PDF
- [x] Smart Groups + filter multi-kriteria + ekspor CSV
- [x] Audit trail log aktivitas lengkap
- [x] Enkripsi PII (NIK, Nomor KK) sesuai UU PDP
- [x] Swagger UI / OpenAPI dokumentasi interaktif
- [x] Test suite: security + workflows (Vitest)
- [x] Pagination standar seluruh tabel dashboard
- [x] Sorting A-Z hunian (natural sort)
- [x] Searchable dropdown (CustomSelect)

### Dalam Pengembangan

- [ ] Push notification web (OneSignal)
- [ ] Peta interaktif persebaran warga (Leaflet)
- [ ] QR Scanner real-time di perangkat mobile

### Direncanakan (v0.2+)

- [ ] Dark mode
- [ ] Ekspor laporan Excel (selain PDF)
- [ ] Pemilihan RT digital (e-voting sederhana)
- [ ] Multi-RT support (satu instance untuk beberapa RT)
- [ ] Mobile app (React Native / PWA)

---

## Lisensi

Proyek ini bersifat **privat**. Seluruh hak cipta dimiliki oleh pengembang.
Dilarang mendistribusikan, memodifikasi, atau menggunakan kode ini untuk keperluan komersial tanpa izin tertulis.

---

<div align="center">

Dibuat dengan hati untuk kemajuan administrasi lingkungan RT Indonesia

**WargaKu** — *Terhubung, Tertata, Untuk Kita Semua*

</div>
