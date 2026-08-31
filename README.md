# Wargaku - Sistem Informasi Pengelolaan RT/RW

**Wargaku** adalah platform web modern full-stack (*production-grade*) yang dirancang untuk digitalisasi, transparansi, dan efisiensi tata kelola administrasi kependudukan, keuangan kas & iuran, pengelolaan properti sewa/kos, komunikasi warga, serta penanganan pengaduan masyarakat di tingkat Rukun Tetangga (RT) dan Rukun Warga (RW).

---

## 🚀 Fitur Utama (Berdasarkan Ruang Lingkup Sistem)

1. **Autentikasi Aman & RBAC (Role-Based Access Control):**
   * Otentikasi sesi berbasis **Better Auth** dengan pembagian 6 peran pengguna (*Super Admin, Ketua RT, Sekretaris, Bendahara, Koordinator Kos, dan Warga*).
   * Matriks otorisasi granular dengan **24 Permission** terperinci.
   * Fitur **Role Switcher (Dual-Role)** di Navbar untuk pengurus RT agar dapat beralih secara instan ke Mode Warga Personal (mengelola profil keluarga & iuran pribadi).

2. **Kependudukan & Hunian Terpadu:**
   * Pengelolaan data Kartu Keluarga (KK), biodata anggota keluarga, data hunian fisik, dan integrasi rumah tinggal dengan nomor blok/rumah.
   * Alur verifikasi dokumen scan KK & KTP serta persetujuan pendaftaran akun warga mandiri.
   * Pengajuan perubahan/pemutakhiran data keluarga (*Family Change Request*) dengan validasi pengurus.

3. **Manajemen Properti Sewa (Kos & Kontrakan):**
   * Panel operasional khusus **Koordinator Kos** untuk memantau kapasitas unit dan rasio okupansi kamar.
   * Fitur *Quick Capacity Edit*, pendaftaran *check-in* penyewa (perorangan dengan scan KTP atau sewa keluarga), serta alur resmi *check-out*.

4. **Transparansi Keuangan & Iuran Warga:**
   * Pencatatan kas masuk & keluar disertai unggahan foto bukti nota/kuitansi fisik ke cloud.
   * Alur persetujuan (*approval*) pengeluaran kas berjenjang oleh Ketua RT.
   * Pembuatan aturan tarif iuran, *generate* tagihan otomatis bulanan per KK, pencatatan setoran, dan rekapitulasi tunggakan.
   * Ekspor **Laporan Keuangan Resmi & Cetak PDF** ber-kop surat resmi RT.

5. **Kelompok Warga Cerdas (Smart Groups):**
   * Penyaringan data kependudukan terpadu multi-kriteria (`CitizenFilterBar`) berdasarkan usia, pekerjaan, agama, status verifikasi, dan tipe hunian.
   * Penyimpanan preset filter kustom dan ekspor data daftar warga terfilter ke format **CSV/Excel**.

6. **Pusat Komunikasi & Partisipasi Lingkungan:**
   * Papan pengumuman warga resmi dengan kategori (*Umum, Penting, Mendesak*) dan fitur pin prioritas.
   * Kalender jadwal agenda kegiatan lingkungan (kerja bakti, rapat warga, posyandu).
   * Siaran notifikasi sistem (*System Broadcasts*) dan notifikasi internal (Personal & Dinas).

7. **Pengaduan Laporan Publik:**
   * Formulir pelaporan keluhan warga publik tanpa perlu login, terproteksi dari bot/spam menggunakan **Cloudflare Turnstile (CAPTCHA)**.
   * Penerbitan **Kode Tracking Instan** untuk pelacakan perkembangan status penanganan laporan secara real-time.
   * Manajemen tindak lanjut pengaduan oleh pengurus RT (Menunggu $\rightarrow$ Proses $\rightarrow$ Selesai / Ditolak).

8. **QR Code Penanda Hunian:**
   * Generator token QR unik untuk setiap rumah dan lokasi properti sewa.
   * Pengunduhan individual dan pencetakan massal berkas PDF QR Code untuk stiker fisik hunian.
   * Pemindaian QR Code interaktif langsung via kamera browser (tamu umum melihat info dasar properti; warga/pengurus login melihat data kependudukan).

9. **Peta Spasial, Pengaturan Sistem & Audit Trail:**
   * Peta interaktif berbasis **Leaflet** untuk visualisasi sebaran rumah tinggal, fasilitas umum, dan batas wilayah RT.
   * Konfigurasi identitas RT (nama RT/RW, kelurahan, alamat sekretariat, logo resmi, dan kontak darurat lingkungan).
   * *Audit Trail Log* untuk merekam jejak aktivitas pengguna dan modul yang diakses demi akuntabilitas keamanan.

---

## 🛠️ Tech Stack

* **Framework Utama:** [Next.js 16 (App Router)](https://nextjs.org/) & React 19
* **Bahasa Pemrograman:** [TypeScript 5](https://www.typescriptlang.org/)
* **Database & Driver:** MySQL 8+ & [mysql2](https://github.com/sidorares/node-mysql2)
* **ORM (Object-Relational Mapper):** [Drizzle ORM](https://orm.drizzle.team/) & `drizzle-kit`
* **Sistem Autentikasi:** [Better Auth](https://www.better-auth.com/)
* **Validasi Skema:** [Zod 4](https://zod.dev/) & `react-hook-form`
* **Desain & Styling:** [Tailwind CSS v4](https://tailwindcss.com/), Radix UI Primitives, & [Lucide Icons](https://lucide.dev/)
* **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
* **Visualisasi Grafik:** [Recharts](https://recharts.org/)
* **Peta Spasial:** [Leaflet](https://leafletjs.com/) & `react-leaflet`
* **Ekspor & Generator:** `jspdf`, `html-to-image`, `qrcode`, & `qr-scanner`
* **Integrasi Layanan Cloud:**
  * **Penyimpanan Berkas / Foto:** Cloudinary
  * **Email Transaksional:** Brevo (Sendinblue)
  * **Anti-Bot Security:** Cloudflare Turnstile
  * **Push Notification:** OneSignal
* **Pengujian (Testing):** [Vitest](https://vitest.dev/)

---

## 📂 Struktur Proyek

```text
wargaku/
├── app/                      # Next.js App Router (UI Pages, Components & Handlers)
│   ├── (auth)/               # Halaman otentikasi (login, register, forgot-password)
│   ├── (public)/             # Portal publik (landing page, /lapor, tracking aduan, scan QR)
│   ├── activate-account/     # Alur aktivasi akun baru warga / penyewa sewa
│   ├── api/                  # API Route Handlers (Auth, Kependudukan, Kas, Laporan, dll.)
│   ├── api-docs/             # Dokumentasi Swagger UI OpenAPI
│   ├── dashboard/            # Modul Dashboard Pengurus & Warga
│   │   ├── activities/       # Agenda & kegiatan RT
│   │   ├── announcements/    # Manajemen pengumuman
│   │   ├── approvals/        # Antrean verifikasi registrasi & berkas dokumen
│   │   ├── audit-logs/       # Log aktivitas audit sistem (Super Admin)
│   │   ├── cash/             # Buku kas masuk, kas keluar & Cetak Laporan Keuangan PDF
│   │   ├── complaints/       # Manajemen tindak lanjut pengaduan
│   │   ├── complaints-report/# Laporan rekapitulasi pengaduan publik
│   │   ├── dues/             # Tagihan iuran, setoran bulanan & rekap tunggakan
│   │   ├── family/           # Profil biodata Kartu Keluarga & anggota (Role Warga)
│   │   ├── my-fees/          # Histori iuran personal warga
│   │   ├── my-properties/    # Manajemen properti sewa pribadi (Pemilik Kos)
│   │   ├── neighborhood/     # Peta spasial lingkungan & direktori tetangga
│   │   ├── notifications/    # Notifikasi in-app (Personal & Dinas)
│   │   ├── permissions/      # Matriks otorisasi RBAC (Super Admin)
│   │   ├── profile/          # Profil akun pengguna
│   │   ├── qr-codes/         # Generator & cetak QR Code hunian
│   │   ├── rentals/          # Panel Koordinator Kos & manajemen penghuni
│   │   ├── residents/        # Master data kependudukan, hunian & detail keluarga (families/[id])
│   │   ├── smart-groups/     # Kelompok warga cerdas & ekspor data
│   │   ├── system-broadcast/ # Siaran notifikasi darurat/pemeliharaan sistem
│   │   ├── system-config/    # Konfigurasi identitas RT & kontak darurat
│   │   └── users/            # Manajemen pengguna (Super Admin)
│   ├── globals.css           # Konfigurasi CSS Tailwind v4
│   └── layout.tsx            # Root Layout
├── components/               # Komponen UI global, modal dialog, formulir & provider
├── db/                       # Konfigurasi Database Drizzle ORM
│   ├── index.ts              # Connection pool MySQL
│   ├── schema.ts             # Skema 20 tabel basis data
│   └── seed.ts               # Script seeding Roles, Permissions, Pengaturan & Super Admin
├── docs/                     # Dokumentasi Lengkap Sistem
│   ├── roles/                # Dokumen alur peran (super_admin, ketua_rt, sekretaris, bendahara, koordinator_kos, warga, publik)
│   └── security/             # Standar implementasi keamanan & hak akses
├── lib/                      # Helper, utilitas & integrasi layanan pihak ketiga
│   ├── auth.ts               # Konfigurasi Better Auth server
│   ├── cloudinary.ts         # Helper upload media Cloudinary
│   ├── mail.ts               # Helper pengiriman email transaksional Brevo
│   ├── rbac.ts               # Helper validasi hak akses permission
│   └── turnstile.ts          # Helper validasi token CAPTCHA Cloudflare Turnstile
├── public/                   # Aset statis (gambar, logo, icon)
├── scripts/                  # Skrip utilitas pengembang (security scanner)
├── tests/                    # Pengujian otomatis Vitest (security & workflow tests)
├── drizzle.config.ts         # Konfigurasi Drizzle Kit
├── .env.example              # Template variabel lingkungan sistem
├── package.json              # Manajemen dependensi dan script npm
└── tsconfig.json             # Konfigurasi TypeScript
```

---

## ⚙️ Petunjuk Instalasi & Menjalankan Proyek

### 1. Kloning Repositori
```bash
git clone git@github.com:Araihan413/wargaku.git
cd wargaku
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables (`.env`)
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi koneksi database MySQL, kunci rahasia Better Auth, serta kredensial layanan pihak ketiga (Brevo, Cloudinary, Turnstile).

### 4. Sinkronisasi Skema Database (Drizzle Kit)
Jalankan perintah berikut untuk mengeksekusi migrasi skema tabel ke database MySQL:
```bash
npx drizzle-kit push
```

### 5. Seeding Data Awal
Eksekusi script seeding untuk mengisi master roles, 24 permissions, pengaturan RT default, dan akun Super Admin:
```bash
npm run db:seed
```

* **Akun Default Super Admin:**
  * **Email:** `admin@wargaku.local`
  * **Password:** `admin123`

### 6. Menjalankan Server Lokal (Development)
```bash
npm run dev
```
Akses aplikasi melalui browser di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Pengujian & Audit Keamanan

Proyek ini dilengkapi dengan serangkaian pengujian otomatis menggunakan **Vitest** serta audit keamanan endpoint API:

```bash
# Menjalankan seluruh pengujian unit & integrasi
npm run test

# Menjalankan pengujian keamanan otorisasi & proteksi endpoint
npm run test:security

# Menjalankan pengujian alur kerja (workflow)
npm run test:workflows

# Menjalankan scanner audit keamanan endpoint API
npm run audit:endpoints

# Menjalankan seluruh rangkaian uji keamanan & audit secara bersamaan
npm run security:all
```

---

## 📚 Dokumentasi Panduan Peran (Role Guides)

Panduan operasional dan alur kerja detail per peran dapat dilihat pada direktori `docs/roles/`:
* [Super Admin Guide](docs/roles/super_admin.md)
* [Ketua RT Guide](docs/roles/ketua_rt.md)
* [Sekretaris Guide](docs/roles/sekretaris.md)
* [Bendahara Guide](docs/roles/bendahara.md)
* [Koordinator Kos Guide](docs/roles/koordinator_kos.md)
* [Warga Guide](docs/roles/warga.md)
* [Publik Guide](docs/roles/publik.md)
