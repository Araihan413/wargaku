# Matriks Skenario Uji Alur Bisnis (Workflow Test Scenarios)
*Sistem Informasi Wargaku*

Dokumen ini memetakan seluruh skenario pengujian alur bisnis (*Business Logic*) yang mencakup **Alur Benar (*Happy Path*)** dan **Alur Salah / Percobaan Eksploitasi (*Negative / Abuse Path*)** pada modul-modul utama Wargaku.

---

## 1. Modul Autentikasi & Registrasi Pengguna

| ID Skenario | Persona | Tipe Alur | Skenario Pengujian | Input Data | Hasil yang Diharapkan (Expected Result) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `WF-AUTH-01` | Warga Baru | ✅ Happy | Registrasi mandiri akun kepala keluarga | NIK 16 digit valid, email aktif, sandi kuat (>= 8 karakter) | Data tersimpan dengan status `pending`, menunggu persetujuan pengurus. |
| `WF-AUTH-02` | Warga Baru | ❌ Negative | Registrasi dengan NIK yang sudah terdaftar | NIK yang sudah digunakan warga lain | Pendaftaran ditolak dengan pesan error *"NIK sudah terdaftar di sistem"*. |
| `WF-AUTH-03` | Warga Baru | ❌ Negative | Registrasi dengan format password lemah | Password kurang dari 6 karakter (misal: `123`) | Validasi Zod menolak sebelum submit ke database. |
| `WF-AUTH-04` | Warga `pending` | ❌ Negative | Akses dashboard saat status akun masih `pending` | Sesi user dengan status `pending` | User dialihkan ke halaman pemberitahuan menunggu approval, akses menu dashboard diblokir. |
| `WF-AUTH-05` | Pengurus (RT) | ✅ Happy | Approval akun warga oleh RT/Sekretaris | Klik tombol "Setujui" pada daftar permohonan akun | Status user berubah menjadi `active`, notifikasi email aktivasi terkirim. |
| `WF-AUTH-06` | Warga `active` | ✅ Happy | Login akun yang sudah disetujui | Email & password benar | Berhasil masuk ke dashboard utama warga. |
| `WF-AUTH-07` | Akun `suspended`| ❌ Negative | Login akun yang dinonaktifkan pengurus | Email & password benar, status akun `suspended` | Login ditolak dengan pesan *"Akun Anda sedang dinonaktifkan"*. |

---

## 2. Modul Keuangan & Kas RT

| ID Skenario | Persona | Tipe Alur | Skenario Pengujian | Input Data | Hasil yang Diharapkan (Expected Result) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `WF-FIN-01` | Bendahara | ✅ Happy | Pencatatan kas masuk (Pemasukan) | Jenis: `income`, Nominal: `Rp 500.000`, Kategori: `Iuran Sampah` | Transaksi tersimpan, saldo kas bertambah Rp 500.000, tercatat di `activity_logs`. |
| `WF-FIN-02` | Bendahara | ✅ Happy | Pencatatan kas keluar (Pengeluaran) | Jenis: `expense`, Nominal: `Rp 200.000`, Kategori: `Perbaikan Lampu` | Transaksi tersimpan, saldo kas berkurang Rp 200.000. |
| `WF-FIN-03` | Bendahara | ❌ Negative | Pencatatan nominal negatif atau nol | Nominal: `-100.000` atau `0` | Skema validasi Zod menolak dengan error *"Nominal harus lebih besar dari 0"*. |
| `WF-FIN-04` | Warga Biasa | ❌ Negative | Warga mencoba membuat transaksi kas | Request POST ke `/api/cash-transactions` | Ditolak dengan status **`403 Forbidden`** (hanya role Bendahara/Admin yang diizinkan). |
| `WF-FIN-05` | Warga Biasa | ✅ Happy | Warga melihat laporan kas publik/transparan | Membuka tab Kas di dashboard warga | Menampilkan rekap kas secara *read-only* tanpa tombol edit/hapus. |
| `WF-FIN-06` | Bendahara | ❌ Negative | Hapus transaksi yang sudah diarsipkan/tutup buku | Request DELETE pada transaksi periode lampau | Ditolak dengan pesan *"Transaksi periode lampau telah dikunci"*. |

---

## 3. Modul Kependudukan & Kartu Keluarga (Anti-IDOR)

| ID Skenario | Persona | Tipe Alur | Skenario Pengujian | Input Data | Hasil yang Diharapkan (Expected Result) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `WF-FAM-01` | Kepala Keluarga | ✅ Happy | Menambah anggota keluarga ke KK miliknya | Biodata anak/istri, NIK valid 16 digit | Anggota keluarga berhasil terhubung ke `family_id` user yang bersangkutan. |
| `WF-FAM-02` | Kepala Keluarga | ❌ Negative | **Uji Celah IDOR**: Menambah anggota ke KK milik tetangga | Memanipulasi payload `family_id` ke ID keluarga lain | Backend menolak dengan status **`403 Forbidden`** (hanya boleh mengelola keluarga sendiri). |
| `WF-FAM-03` | Kepala Keluarga | ✅ Happy | Mengubah data anggota keluarga sendiri | Ubah nama / no telepon anggota keluarga | Data berhasil diperbarui. |
| `WF-FAM-04` | Warga Biasa | ❌ Negative | **Uji Celah IDOR**: Menghapus data keluarga orang lain | Request DELETE `/api/family-members/{id_tetangga}` | Backend memverifikasi kepemilikan dan menolak request dengan kode `403/404`. |
| `WF-FAM-05` | Ketua RT | ✅ Happy | Pengurus RT mengedit data kependudukan warga | Sesi pengurus dengan izin `manage-residents` | Berhasil memperbarui data dan tercatat di audit log. |

---

## 4. Modul Properti Kos & Rumah Sewa (`rental-residents`)

| ID Skenario | Persona | Tipe Alur | Skenario Pengujian | Input Data | Hasil yang Diharapkan (Expected Result) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `WF-RNT-01` | Pemilik Properti| ✅ Happy | Mendaftarkan penyewa kos baru | Nama penyewa, No HP, NIK, Tgl Mulai Sewa | Data kontrak tersimpan dengan status `pending_verification`. |
| `WF-RNT-02` | Ketua RT | ✅ Happy | Verifikasi data penyewa kos | Klik tombol verifikasi kontrak penyewa | Status berubah menjadi `active`, penyewa terdaftar di statistik kependudukan non-permanen. |
| `WF-RNT-03` | Pemilik Properti| ✅ Happy | Proses check-out penyewa yang habis kontrak | Klik tombol "Check-Out" pada masa sewa selesai | Status berubah menjadi `checked_out`, kamar kos kembali berstatus `kosong`. |
| `WF-RNT-04` | Penyewa Kos | ❌ Negative | Penyewa `checked_out` mencoba mengakses hak warga aktif | Sesi penyewa yang masa sewanya sudah selesai | Ditolak dari akses dashboard warga aktif. |
| `WF-RNT-05` | Pemilik A | ❌ Negative | **Uji Celah IDOR**: Pemilik A menghapus penyewa kos milik Pemilik B | Request DELETE `/api/rental-residents/{id_kos_B}` | Backend menolak dengan status **`403 Forbidden`**. |

---

## 5. Modul Surat Pengantar & Pengaduan Warga

| ID Skenario | Persona | Tipe Alur | Skenario Pengujian | Input Data | Hasil yang Diharapkan (Expected Result) |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `WF-DOC-01` | Warga | ✅ Happy | Mengajukan permohonan surat pengantar RT | Jenis: `Surat Keterangan Domisili`, Keterangan: `Keperluan Bank` | Surat tersimpan dengan status `pending_approval`. |
| `WF-DOC-02` | Sekretaris / RT | ✅ Happy | Menyetujui dan menerbitkan surat pengantar | Klik tombol "Setujui" & nomor surat di-generate | Status menjadi `approved`, PDF siap diunduh warga. |
| `WF-DOC-03` | Warga B | ❌ Negative | **Uji Celah IDOR**: Mengunduh berkas surat milik Warga A | Akses direct download surat milik warga lain | Ditolak dengan status **`403 Forbidden`**. |
| `WF-CMP-01` | Publik / Warga | ✅ Happy | Mengirimkan laporan pengaduan dengan Turnstile | Judul aduan, deskripsi, foto bukti, token Turnstile valid | Laporan tersimpan dan kode tiket tracking diterbitkan. |
| `WF-CMP-02` | Bot / Attacker | ❌ Negative | Mengirim laporan spam tanpa token CAPTCHA | Request POST form laporan tanpa token Turnstile | Backend menolak dengan status **`400 Bad Request`** (*Captcha verification failed*). |
