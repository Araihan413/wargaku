# Wargaku - Sistem Informasi Pengelolaan RT/RW

**Wargaku** adalah platform full-stack berbasis web untuk digitalisasi, transparansi, dan efisiensi pengelolaan administrasi kependudukan, keuangan kas/iuran, pengaduan laporan warga, serta layanan surat-menyurat di tingkat Rukun Tetangga (RT) dan Rukun Warga (RW).

---

## 🚀 Fitur Utama (MVP)

1.  **Kependudukan Terpusat:** Pengelolaan data Kartu Keluarga (KK), warga tetap, properti sewa (kos/kontrakan), dan penghuni sewa secara detail.
2.  **Autentikasi & RBAC (Role-Based Access Control):** Sistem login aman menggunakan **Better Auth** dengan pembagian 6 peran (*roles*): Super Admin, Ketua RT, Sekretaris, Bendahara, Koordinator Kost, dan Warga.
3.  **Transparansi Keuangan & Iuran Bulanan:** Pencatatan otomatis tagihan iuran wajib bulanan per KK, pencatatan kas masuk/keluar oleh Bendahara, dan persetujuan pengeluaran oleh Ketua RT.
4.  **Administrasi Surat Pengantar (Hybrid):** Warga mengajukan surat secara online, Sekretaris memproses data dengan fitur satu-klik salin data, dan Ketua RT melakukan approval secara fisik/sistem.
5.  **Pengaduan Laporan Publik:** Formulir pelaporan warga tanpa login yang dilengkapi dengan Cloudflare Turnstile (CAPTCHA) dan pelacakan status laporan menggunakan Kode Tracking.
6.  **Scan QR Code Hunian:** Cetak dan pindai QR Code fisik di rumah warga untuk melihat informasi dasar properti bagi tamu umum, serta informasi detail bagi warga terdaftar/pengurus.
7.  **Smart Grouping Warga:** Fitur pembobotan kustom untuk pengelompokan warga secara dinamis berdasarkan kriteria tertentu (misal: bantuan sosial) dan ekspor ke Excel/PDF.

---

## 🛠️ Tech Stack

*   **Framework Utama:** [Next.js 16 (App Router)](https://nextjs.org/) & React 19
*   **Bahasa Pemrograman:** [TypeScript 5](https://www.typescriptlang.org/)
*   **Database & Driver:** MySQL 8+ & [mysql2](https://github.com/sidorares/node-mysql2)
*   **ORM (Object-Relational Mapper):** [Drizzle ORM](https://orm.drizzle.team/)
*   **Sistem Autentikasi:** [Better Auth](https://www.better-auth.com/)
*   **Validasi Skema:** [Zod 4](https://zod.dev/)
*   **Desain & UI Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
*   **Visualisasi Grafik:** [Recharts](https://recharts.org/)
*   **Peta Interaktif:** [Leaflet](https://leafletjs.com/) & `react-leaflet`
*   **Dokumentasi API:** Swagger UI (`swagger-jsdoc` & `swagger-ui-react`)

---

## 📂 Struktur Proyek

```text
wargaku/
├── app/                  # Direktori Next.js App Router (UI Pages & API)
│   ├── api/              # API Route Handlers (Auth, Kependudukan, dll.)
│   ├── unauthorized/     # Halaman penolakan hak akses (RBAC)
│   ├── globals.css       # Konfigurasi CSS global (Tailwind v4)
│   ├── layout.tsx        # Layout utama aplikasi
│   └── page.tsx          # Beranda utama
├── db/                   # Konfigurasi Database Drizzle
│   ├── index.ts          # Inisialisasi koneksi pool database (MySQL)
│   ├── schema.ts         # Skema 20 tabel database lengkap
│   └── seed.ts           # Script pengisian data awal (Roles, Permissions, & Super Admin)
├── lib/                  # Utilitas dan Helper kode
│   ├── auth.ts           # Konfigurasi server Better Auth
│   ├── auth-client.ts    # Inisialisasi client Better Auth (FE)
│   ├── rbac.ts           # Helper pengecekan hak akses di server
│   └── validations/      # Skema Zod untuk validasi input
├── public/               # Aset statis (gambar, icon, logo)
├── drizzle.config.ts     # Konfigurasi Drizzle Kit untuk MySQL
├── proxy.ts              # Next.js 16+ Route Proxy (Proteksi sesi & redirect rute)
├── package.json          # Manajemen dependensi dan script npm
└── tsconfig.json         # Konfigurasi TypeScript
```

---

## ⚙️ Petunjuk Instalasi & Menjalankan Proyek

### 1. Kloning Repositori
```bash
git clone git@github.com:Araihan413/wargaku.git
cd wargaku
```

### 2. Instalasi Dependensi
Gunakan flag `--legacy-peer-deps` karena proyek menggunakan React 19:
```bash
npm install --legacy-peer-deps
```

### 3. Konfigurasi Environment Variables (`.env`)
Buat berkas `.env` di tingkat root proyek dan masukkan kredensial koneksi database MySQL Anda serta rahasia autentikasi:
```env
DATABASE_URL="mysql://username:password@127.0.0.1:3306/wargaku"

BETTER_AUTH_SECRET="masukkan_random_secret_anda"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Sinkronisasi Database (Drizzle Kit)
Jalankan perintah berikut untuk membuat 20 tabel skema aplikasi secara otomatis di database MySQL Anda:
```bash
npx drizzle-kit push
```

### 5. Seeding Data Awal (Roles, Permissions & Admin User)
Masukkan data dasar hak akses dan akun Super Admin utama dengan mengeksekusi script seed:
```bash
npm run db:seed
```
*   **Akun Default Login Super Admin:**
    *   **Email:** `admin@wargaku.local`
    *   **Password:** `admin123`

### 6. Menjalankan Server Lokal (Development)
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat sistem yang berjalan.

---

## 📖 Dokumentasi API (Swagger)
Ketika server lokal sedang berjalan, Anda dapat mengakses dokumentasi API yang interaktif dan dapat diuji langsung di:
*   [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (Segera hadir di Minggu 2)
