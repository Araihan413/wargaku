import { db } from './index';
import * as schema from './schema';
import { hashPassword } from 'better-auth/crypto';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('🌱 Memulai proses seeding data...');

  // 1. Seed Roles
  console.log('Seeding roles...');
  const rolesData = [
    {
      id: 1,
      name: 'Super Admin',
      slug: 'super-admin',
      description: 'Pemilik sistem, mengatur semua pengguna dan konfigurasi',
      isDefault: false,
    },
    {
      id: 2,
      name: 'Ketua RT',
      slug: 'ketua-rt',
      description: 'Memimpin RT, mengelola data warga, mengesahkan surat',
      isDefault: false,
    },
    {
      id: 3,
      name: 'Sekretaris',
      slug: 'sekretaris',
      description: 'Mengurus administrasi, surat, pengumuman, kegiatan',
      isDefault: false,
    },
    {
      id: 4,
      name: 'Bendahara',
      slug: 'bendahara',
      description: 'Mengelola keuangan RT (pemasukan & pengeluaran)',
      isDefault: false,
    },
    {
      id: 5,
      name: 'Koordinator Kost',
      slug: 'koordinator-kost',
      description: 'Bertanggung jawab atas data penghuni kost',
      isDefault: false,
    },
    {
      id: 6,
      name: 'Warga',
      slug: 'warga',
      description: 'Pengguna akhir, hanya bisa melihat informasi dan melapor',
      isDefault: true,
    },
  ];

  for (const role of rolesData) {
    await db.insert(schema.roles).values(role).onDuplicateKeyUpdate({
      set: {
        name: role.name,
        slug: role.slug,
        description: role.description,
        isDefault: role.isDefault,
      },
    });
  }

  // 2. Seed Permissions
  console.log('Seeding permissions...');
  await db.delete(schema.rolePermissions);
  await db.delete(schema.permissions);

  const permissionsData = [
    { id: 1, slug: 'view-residents', name: 'Lihat Data Warga (Strict Read-Only)', module: 'kependudukan', description: 'Melihat seluruh tabel & detail kependudukan warga' },
    { id: 2, slug: 'manage-residents', name: 'Kelola Data Warga (Full Operational)', module: 'kependudukan', description: 'Membuat, mengedit, ganti KK, nonaktifkan, dan menghapus data warga' },
    { id: 3, slug: 'manage-smart-groups', name: 'Kelompok Warga (Smart Group)', module: 'kependudukan', description: 'Mengelola kelompok warga terfilter' },
    { id: 4, slug: 'manage-dwellings', name: 'Cetak QR Code RT', module: 'hunian', description: 'Mengelola hunian & mencetak QR Code rumah' },
    { id: 5, slug: 'verify-registrations', name: 'Persetujuan Registrasi', module: 'verifikasi', description: 'Menyetujui pendaftaran akun warga' },
    { id: 6, slug: 'verify-documents', name: 'Verifikasi Berkas KK/KTP', module: 'verifikasi', description: 'Menyetujui berkas scan KK & KTP warga' },
    { id: 7, slug: 'manage-income', name: 'Catat Pemasukan Kas', module: 'kas_rt', description: 'Mencatat transaksi pemasukan kas RT' },
    { id: 8, slug: 'manage-expense', name: 'Catat Pengeluaran Kas', module: 'kas_rt', description: 'Mencatat transaksi pengeluaran kas RT' },
    { id: 9, slug: 'view-finance', name: 'Laporan Keuangan Kas RT', module: 'kas_rt', description: 'Melihat laporan transaksi kas dan saldo RT' },
    { id: 10, slug: 'manage-iuran', name: 'Kelola & Setor Iuran', module: 'iuran_warga', description: 'Mengatur tarif, inisialisasi, dan menginput setoran iuran warga' },
    { id: 11, slug: 'view-arrears', name: 'Laporan Tunggakan Iuran', module: 'iuran_warga', description: 'Melihat rekapitulasi tunggakan iuran warga' },
    { id: 12, slug: 'manage-announcements', name: 'Kelola Pengumuman', module: 'pengumuman', description: 'Membuat, mengedit, dan menghapus pengumuman warga' },
    { id: 13, slug: 'manage-activities', name: 'Kelola Kegiatan RT', module: 'kegiatan', description: 'Mengelola agenda dan jadwal kegiatan warga RT' },
    { id: 14, slug: 'manage-complaints', name: 'Tanggapan Pengaduan Warga', module: 'laporan', description: 'Merespon dan memperbarui status laporan aduan warga' },
    { id: 15, slug: 'manage-boarding', name: 'Kelola Penyewa Kos', module: 'properti', description: 'Mengelola kamar, unit, dan data penyewa kos/homestay' },
    { id: 16, slug: 'manage-users', name: 'Manajemen Pengguna (Super Admin)', module: 'pengguna', description: 'CRUD pengguna, reset password, suspend & mutasi peran' },
    { id: 17, slug: 'manage-roles', name: 'Role & Permission (Super Admin)', module: 'pengguna', description: 'Mengatur matriks otorisasi dan hak akses permission role' },
    { id: 18, slug: 'view-audit-logs', name: 'Log Aktivitas Audit (Super Admin)', module: 'pengguna', description: 'Melihat log riwayat aktivitas audit keamanan' },
    { id: 19, slug: 'view-complaints-report', name: 'Laporan Pengaduan Global (Super Admin)', module: 'laporan', description: 'Memantau laporan pengaduan wilayah' },
    { id: 20, slug: 'manage-system-config', name: 'Konfigurasi Sistem (Super Admin)', module: 'pengguna', description: 'Mengatur konfigurasi sistem & kop surat' },
    { id: 21, slug: 'manage-family-profile', name: 'Kelola Anggota Keluarga & Biodata', module: 'warga', description: 'Mengelola data anggota keluarga & biodata KK' },
    { id: 22, slug: 'view-neighborhood-map', name: 'Peta Hunian & Tetangga', module: 'warga', description: 'Melihat peta hunian dan direktori warga tetangga' },
    { id: 23, slug: 'manage-my-properties', name: 'Aset Properti Sewa', module: 'warga', description: 'Mengolah pendaftaran aset sewa pribadi dan memantau statusnya' },
    { id: 24, slug: 'view-my-fees', name: 'Status & Histori Iuran Saya', module: 'warga', description: 'Memantau status kelunasan dan riwayat pembayaran iuran warga' },
  ];

  for (const perm of permissionsData) {
    await db.insert(schema.permissions).values(perm);
  }

  // 3. Seed Role Permissions
  console.log('Seeding role permissions...');
  const rolePermissionsData: { id: number; roleId: number; permissionId: number }[] = [];
  let rpId = 1;

  // Super Admin (1 - 20, 24)
  for (let p = 1; p <= 20; p++) {
    rolePermissionsData.push({ id: rpId++, roleId: 1, permissionId: p });
  }

  // Ketua RT (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 24)
  const rtPerms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  for (const p of rtPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 2, permissionId: p });
  }

  // Sekretaris (1, 2, 3, 4, 5, 6, 12, 13, 14, 15)
  const sekPerms = [1, 2, 3, 4, 5, 6, 12, 13, 14, 15];
  for (const p of sekPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 3, permissionId: p });
  }

  // Bendahara (7, 8, 9, 10, 11, 24)
  const bendPerms = [7, 8, 9, 10, 11];
  for (const p of bendPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 4, permissionId: p });
  }

  // Koordinator Kost (15)
  const kostPerms = [15];
  for (const p of kostPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 5, permissionId: p });
  }

  // Warga (21, 22, 23, 24)
  const wargaPerms = [21, 22, 23, 24];
  for (const p of wargaPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 6, permissionId: p });
  }

  for (const rp of rolePermissionsData) {
    await db.insert(schema.rolePermissions).values(rp);
  }

  // 4. Seed Default Super Admin User
  console.log('Seeding default Super Admin user...');
  const adminEmail = 'admin@wargaku.local';
  const plainPassword = 'admin123';
  const hashedPassword = await hashPassword(plainPassword);

  const existingAdmins = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));

  if (existingAdmins.length === 0) {
    await db.insert(schema.users).values({
      id: '1',
      name: 'Super Admin Utama',
      email: adminEmail,
      status: 'active',
    });

    await db.insert(schema.userRoles).values({
      userId: '1',
      roleId: 1,
      isPrimary: true,
    }).onDuplicateKeyUpdate({ set: { id: sql`id` } });

    await db.insert(schema.accounts).values({
      id: 'admin-credential-id',
      accountId: '1',
      providerId: 'credential',
      userId: '1',
      password: hashedPassword,
      issuer: 'local:credential',
    });

    console.log(`✅ Default Super Admin berhasil dibuat!`);
    console.log(`   Email   : ${adminEmail}`);
    console.log(`   Password: ${plainPassword}`);
  } else {
    console.log('ℹ️ User Super Admin sudah ada, melewati pembuatan user.');
  }

  // 5. Seed System Settings (Default single row ID 1)
  console.log('Seeding system settings...');
  const existingSettings = await db.select().from(schema.systemSettings).where(eq(schema.systemSettings.id, 1));
  if (existingSettings.length === 0) {
    await db.insert(schema.systemSettings).values({
      id: 1,
      rtName: '001',
      rwName: '005',
      villageName: 'Argorejo',
      subdistrict: 'Sedayu',
      city: 'Kabupaten Bantul',
      secretariatAddress: 'Dusun Polaman, Kepuhan',
      officialEmail: 'rt001rw005@wargaku.local',
      emergencyContacts: [
        { id: '1', name: 'Ketua RT', phone: '081234567890', subtitle: 'Pak RT' },
        { id: '2', name: 'Polsek Sedayu', phone: '110', subtitle: 'Layanan 24 Jam' }
      ]
    });
  } else {
    await db.update(schema.systemSettings).set({
      villageName: 'Argorejo',
      subdistrict: 'Sedayu',
      city: 'Kabupaten Bantul',
      secretariatAddress: 'Dusun Polaman, Kepuhan',
    }).where(eq(schema.systemSettings.id, 1));
  }

  console.log('🎉 Proses seeding selesai dengan sukses!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Gagal melakukan seeding:', err);
  process.exit(1);
});
