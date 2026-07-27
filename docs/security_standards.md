# Dokumen Standar Keamanan Sistem Informasi Wargaku
*Versi 1.0 - Juli 2026*
*Disusun oleh: Cybersecurity Specialist / Security Compliance Auditor*

---

> [!IMPORTANT]
> **Dasar Hukum & Kepatuhan (Compliance):**
> Sistem Informasi Wargaku mengelola data kependudukan sensitif. Pengolahan data dalam sistem ini tunduk pada **Undang-Undang Pelindungan Data Pribadi (UU PDP) No. 27 Tahun 2022** Indonesia. Setiap kegagalan dalam melindungi PII (Personally Identifiable Information) dapat berakibat pada sanksi hukum dan denda administratif bagi pengelola.

---

## 1. Pendahuluan
Dokumen ini menetapkan standar kelayakan keamanan minimum yang harus dipenuhi oleh Sistem Informasi **Wargaku**. Evaluasi kelayakan keamanan dibagi menjadi dua domain utama:
1. **Keamanan Internal Sistem (Application & Data Security):** Melindungi data dari akses tidak sah oleh pengguna dalam sistem, pengelolaan hak akses (RBAC), serta integritas kode program.
2. **Keamanan terhadap Serangan Luar (Infrastructure & Network Security):** Melindungi sistem dari eksploitasi oleh pihak luar yang tidak memiliki akun, mencegah serangan siber, dan menjaga ketersediaan layanan (*availability*).

---

## 2. Standar Keamanan Internal Sistem

### 2.1 Perlindungan PII (Personally Identifiable Information)
Data kependudukan seperti NIK, Nomor KK, No HP, dan Alamat merupakan target utama pencurian identitas.

*   **Penyensoran Data (Data Masking) di Antarmuka:**
    *   Warga biasa yang masuk ke dashboard hanya boleh melihat versi NIK dan nomor HP yang disensor pada halaman pencarian warga.
        *   *Format Sensor NIK:* Menampilkan 3 digit pertama dan 3 digit terakhir (contoh: `320**********567`).
        *   *Format Sensor HP:* Menampilkan format `08` di awal dan 3 digit di akhir (contoh: `0812******789`).
    *   Data penuh tanpa sensor hanya boleh diakses oleh akun pengurus yang memiliki izin `view-residents`.
*   **Keamanan Penyimpanan Scan Dokumen Fisik (KTP & KK):**
    *   Setiap file scan KTP dan KK yang diunggah warga **tidak boleh** diletakkan di folder publik yang dapat diakses langsung via URL statis tanpa autentikasi (seperti direktori `/public`).
    *   Penyimpanan berkas pada layanan pihak ketiga (seperti Cloudinary) harus menggunakan opsi tipe sumber daya **Private** atau **Authenticated**, sehingga memerlukan token URL yang ditandatangani (*Signed URL*) dengan waktu kedaluwarsa singkat (maksimal 15 menit) untuk mengaksesnya.
*   **Enkripsi Data Sensitif:**
    *   Sandi pengguna (*password*) wajib di-hash menggunakan algoritma **bcrypt** dengan *work factor* minimal 10 (telah diimplementasikan).
    *   Semua data *in-transit* (saat dikirim dari browser ke server) wajib dienkripsi menggunakan protokol **TLS 1.3 / HTTPS**.

### 2.2 Autentikasi dan Manajemen Sesi (Authentication & Session Management)
*   **Kebijakan Sesi:**
    *   Token sesi Better Auth wajib disimpan di dalam cookie berjenis **HttpOnly**, **Secure** (hanya dikirim lewat HTTPS), dan **SameSite=Lax** untuk mencegah pencurian sesi via skrip berbahaya (XSS).
    *   Waktu kedaluwarsa sesi (session lifetime) dibatasi maksimal 7 hari untuk kemudahan warga, namun untuk akun administratif (Super Admin, Ketua RT, Bendahara) disarankan menggunakan opsi *auto-logout* setelah 30 menit tidak aktif (*idle timeout*).
*   **Verifikasi Registrasi:**
    *   Registrasi mandiri oleh Kepala Keluarga baru wajib berstatus `pending` secara default dan membutuhkan persetujuan manual (approval) oleh Ketua RT atau Sekretaris sebelum dapat masuk ke dashboard utama.

### 2.3 Kontrol Akses Berbasis Peran (Role-Based Access Control - RBAC)
*   **Validasi Multi-Layer (Client & Server):**
    *   Menyembunyikan menu di sisi frontend (UI) tidaklah cukup. Setiap request data ke backend (Next.js Server Actions, Route Handlers/API Endpoints, dan Server Pages) **wajib** melakukan pemeriksaan ulang izin menggunakan helper `requirePermission` atau `hasPermission` sebelum data dikembalikan atau dimanipulasi.
*   **Prinsip Hak Akses Minimum (Principle of Least Privilege):**
    *   Setiap peran (*role*) hanya diberikan izin (*permission*) yang benar-benar dibutuhkan untuk melakukan tugasnya.
    *   *Bendahara* hanya boleh memiliki akses finansial dan mutlak diblokir dari modul kependudukan.
    *   *Sekretaris* dapat melihat data kependudukan untuk administrasi surat, tetapi tidak boleh menambah/mengubah data kependudukan warga tetap.
*   **Validasi Kepemilikan (BOLA/IDOR Prevention):**
    *   Untuk operasi edit mandiri oleh warga (seperti `manage-own-family`), sistem wajib memvalidasi bahwa `family_id` atau `user_id` yang diedit adalah milik user yang sedang login, bukan milik KK lain (mencegah *Insecure Direct Object Reference*).

### 2.4 Audit Trail & Logging
*   **Pencatatan Log Aktivitas Kritikal:**
    *   Tabel `activity_logs` harus mencatat setiap operasi manipulasi data (Create, Update, Delete) yang dilakukan oleh pengurus.
    *   Data yang wajib dicatat dalam log meliputi: `user_id`, `action` (jenis aksi), `module` (modul terdampak), `description` (keterangan perubahan), `ip_address`, dan `created_at`.
*   **Pencegahan Kebocoran Informasi di Log:**
    *   Log **tidak boleh** mencatat data sensitif secara eksplisit (seperti password baru warga saat direset oleh Super Admin, isi scan KTP, atau data privat warga).

---

## 3. Standar Pertahanan Terhadap Serangan Luar

### 3.1 SQL Injection (SQLi)
*   **Mitigasi:**
    *   Wajib menggunakan ORM (Drizzle ORM) yang memanfaatkan *prepared statements* dan *parameterized queries* secara default untuk semua interaksi database.
    *   Hindari penggunaan fungsi raw SQL (`sql` template literal dari drizzle) dengan input string mentah dari user tanpa sanitasi.

### 3.2 Cross-Site Scripting (XSS)
*   **Mitigasi:**
    *   Next.js secara bawaan melakukan sanitasi (HTML escaping) pada variabel yang di-render di dalam TSX.
    *   Penggunaan properti `dangerouslySetInnerHTML` di masa mendatang wajib dihindari. Jika sangat terpaksa (misalnya untuk modul pengumuman berformat Rich Text HTML), input wajib dibersihkan menggunakan pustaka sanitasi HTML seperti **DOMPurify** sebelum di-render.
    *   Terapkan HTTP header `Content-Security-Policy` (CSP) untuk membatasi asal muasal skrip JavaScript yang boleh dieksekusi di browser warga.

### 3.3 Cross-Site Request Forgery (CSRF)
*   **Mitigasi:**
    *   Next.js Server Actions secara bawaan telah dilengkapi dengan proteksi terhadap serangan CSRF.
    *   Untuk API endpoint manual (Route Handlers `/api/...`), Better Auth telah mengamankan mekanisme pertukaran session token. Pastikan CORS origin hanya mengizinkan domain utama aplikasi.

### 3.4 DDoS & Bot Spamming pada Endpoint Publik
Beberapa fitur seperti *Laporan Pengaduan* (`complaints`) dan *Scan QR Code* rumah warga dapat diakses oleh publik tanpa perlu login. Ini merupakan celah masuknya serangan spam atau bot.
*   **Mitigasi:**
    *   **Cloudflare Turnstile:** Integrasikan widget Turnstile CAPTCHA pada form pengaduan. Backend wajib melakukan verifikasi token Turnstile ke API Cloudflare sebelum menyimpan laporan ke database.
    *   **Rate Limiting:** Terapkan pembatasan frekuensi request (Rate Limit) pada API pengaduan publik (misalnya maksimal 2 laporan per IP per jam) dan API scan QR (maksimal 60 request per IP per menit) menggunakan Redis token bucket atau middleware khusus.
    *   **Input Validation:** Skema Zod yang ketat wajib digunakan untuk menolak data dengan panjang yang tidak wajar atau format yang tidak valid sebelum menyentuh database.

### 3.5 Keamanan Berkas Unggahan (Secure File Upload)
Fitur unggah KK, KTP, dan bukti transaksi keuangan rentan disalahgunakan untuk mengunggah berkas berbahaya (seperti skrip shell PHP, file executable `.exe`, atau berkas HTML phishing).
*   **Mitigasi:**
    *   **Ukuran Berkas:** Batasi ukuran berkas maksimal 2MB untuk gambar/bukti transaksi dan 5MB untuk PDF (sesuai implementasi API saat ini).
    *   **Validasi MIME Type:** Hanya izinkan berkas dengan ekstensi dan MIME type yang aman: `image/jpeg`, `image/png`, `image/webp`, dan `application/pdf`. Jangan hanya memeriksa ekstensi nama file, melainkan periksa MIME type dari stream data berkas.
    *   **Rename Otomatis:** Semua file yang diunggah wajib diubah namanya secara acak (misal menggunakan UUID atau string acak dari Cloudinary) untuk mencegah penumpukan file dengan nama yang sama (*file collision*) dan mencegah penyerang menebak lokasi file.
    *   **Isolasi Storage:** Hindari menyimpan file di direktori server lokal yang memiliki izin eksekusi kode. Menyimpan file di Cloud Storage eksternal seperti Cloudinary atau Vercel Blob secara efektif mengisolasi server aplikasi dari serangan *Remote Code Execution* (RCE).

---

## 4. Standar Keamanan Infrastruktur & VPS Deployment

Aplikasi ini direncanakan untuk di-deploy ke VPS mandiri (Ubuntu + Nginx + PM2). Konfigurasi infrastruktur berikut wajib dipenuhi untuk mengamankan server dari luar:

### 4.1 Server Hardening (Ubuntu & PM2)
*   **SSH Access Security:**
    *   Ubah port SSH default (`22`) ke port acak lainnya (misal: `2282`).
    *   Matikan otentikasi kata sandi SSH (`PasswordAuthentication no`) dan wajibkan penggunaan kunci SSH (*SSH Key-based authentication*).
    *   Nonaktifkan login SSH langsung untuk user root (`PermitRootLogin no`). Buat user baru dengan hak akses `sudo`.
*   **UFW (Uncomplicated Firewall):**
    *   Aktifkan firewall di server VPS dan hanya izinkan port berikut:
        *   Port `80` (HTTP - dialihkan ke HTTPS)
        *   Port `443` (HTTPS)
        *   Port SSH kustom yang telah diubah
    *   Semua port lainnya wajib ditutup dari akses luar.

### 4.2 Nginx Hardening (Reverse Proxy)
*   **Konfigurasi SSL/TLS:**
    *   Gunakan SSL gratis dari Let's Encrypt dengan perpanjangan otomatis.
    *   Wajibkan penggunaan protokol **TLS 1.2** dan **TLS 1.3** saja (matikan TLS 1.0 dan 1.1 yang rentan).
*   **Header Keamanan Nginx:**
    Tambahkan baris berikut di dalam berkas konfigurasi situs Nginx (`/etc/nginx/sites-available/wargaku`):
    ```nginx
    # Mencegah website di-load di dalam frame/iframe situs lain (anti-clickjacking)
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Mencegah browser menebak MIME-type berkas (anti-MIME sniffing)
    add_header X-Content-Type-Options "nosniff" always;

    # Mengaktifkan filter XSS bawaan pada browser-browser lawas
    add_header X-XSS-Protection "1; mode=block" always;

    # Memaksa koneksi HTTPS selama 1 tahun ke depan (HSTS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    ```

### 4.3 Database Security (MySQL 8+)
*   **Isolasi Port Database:**
    *   Konfigurasikan MySQL untuk hanya mendengarkan koneksi dari host lokal (*localhost* / `127.0.0.1`) dengan menyetel properti `bind-address = 127.0.0.1` di berkas `my.cnf`. Port database (`3306`) **tidak boleh** dibuka untuk umum di firewall VPS.
*   **Manajemen Akun Database:**
    *   Aplikasi tidak boleh menggunakan user `root` MySQL untuk bertransaksi. Buat user database khusus (misal: `wargaku_user`) yang hanya memiliki hak akses penuh ke database `wargaku_db` dan batasi haknya (hanya `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `DROP`, `INDEX`, `ALTER`).

---

## 5. Checklist Evaluasi Kelayakan Keamanan (Audit Checklist)

Gunakan tabel berikut sebagai acuan untuk mengecek kelayakan rilis (*production-ready*) aplikasi Wargaku:

| No | Kriteria Evaluasi Keamanan | Target Hasil | Metode Pengujian | Status (Lulus/Gagal) |
|:---:|:---|:---|:---|:---:|
| **1** | Masking NIK & HP Warga biasa | NIK/HP disensor di UI pencarian warga | Login sebagai Warga, cari warga lain | |
| **2** | Proteksi URL File KTP/KK | Tidak bisa diakses tanpa hak/autentikasi | Coba salin URL Cloudinary KTP ke tab Incognito | |
| **3** | Validasi Token & Session Cookie | Cookie bertanda `HttpOnly` & `Secure` | Cek via DevTools Browser -> Application -> Cookies | |
| **4** | Proteksi Endpoint Edit KK (BOLA) | Warga tidak bisa edit data keluarga KK lain | Lakukan POST edit data KK lain dengan memanipulasi ID | |
| **5** | Validasi Input Skema Zod | Input NIK selain 16 digit ditolak | Input NIK pendek/panjang pada form biodata | |
| **6** | Anti-Spam Pengaduan Warga | Request tanpa Turnstile diblokir backend | Kirim form laporan lewat bypass script tanpa CAPTCHA | |
| **7** | Rate Limiting Laporan | Pengaduan ke-3 dalam 1 jam dari 1 IP diblokir | Kirim 3 aduan berturut-turut dari IP yang sama | |
| **8** | Uji Unggah File Berbahaya | File `.php` / `.js` ditolak di server | Unggah file skrip berbahaya di form KTP/KK | |
| **9** | Port Security VPS | Hanya port SSH, 80, dan 443 yang terbuka | Lakukan port scanning menggunakan `nmap` dari luar | |
| **10** | Isolasi Database Port | Port 3306 tertutup dari luar | Coba hubungkan database lokal dari komputer rumah | |
| **11** | Audit Trail Log | Setiap edit/hapus tercatat di `activity_logs` | Lakukan hapus warga, cek tabel database log | |

---

## 6. Rencana Tanggap Darurat Kebocoran Data (Incident Response Plan)

Jika terdeteksi adanya insiden keamanan atau kebocoran data, pengembang dan pengurus RT harus mengambil langkah-langkah berikut secara terorganisasi:

1.  **Identifikasi & Isolasi (Containment):**
    *   Cari sumber kebocoran (misal: API endpoint tanpa validasi session, atau token Cloudinary yang bocor).
    *   Jika perlu, matikan sementara website Wargaku (*maintenance mode*) untuk menghentikan eksploitasi aktif.
    *   Putuskan sesi mencurigakan secara paksa melalui panel administrasi database pada tabel `sessions` Better Auth.
2.  **Pembersihan & Perbaikan (Eradication):**
    *   Tutup celah keamanan di kode program, kompilasi ulang, dan deploy patch terbaru.
    *   Ganti kunci API (*API Keys*) Cloudinary, Better Auth Secret, dan password database jika ada indikasi kredensial server telah kompromi.
3.  **Pemulihan (Recovery):**
    *   Aktifkan kembali website secara bertahap.
    *   Pantau log aktivitas (`activity_logs`) dan log akses Nginx untuk memastikan tidak ada aktivitas mencurigakan pasca-insiden.
4.  **Notifikasi Warga (Post-Incident):**
    *   Sesuai prinsip UU PDP, jika terjadi kebocoran data pribadi (PII), pengurus wajib memberikan informasi transparan kepada warga terdampak mengenai jenis data yang bocor dan langkah pencegahan yang harus diambil warga (misal mengganti password jika ada kesamaan dengan akun luar).
