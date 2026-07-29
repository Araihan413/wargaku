import { db } from './index';
import * as schema from './schema';
import { hashPassword } from 'better-auth/crypto';
import { eq } from 'drizzle-orm';

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
    { id: 1, slug: 'view-residents', name: 'Lihat Data Warga', module: 'kependudukan', description: 'Melihat seluruh data kependudukan warga tetap & penyewa' },
    { id: 2, slug: 'manage-residents', name: 'Kelola Data Warga', module: 'kependudukan', description: 'Membuat, mengedit, dan menghapus data warga tetap & KK' },
    { id: 3, slug: 'manage-boarding', name: 'Kelola Kos & Penghuni', module: 'kependudukan', description: 'Mengelola properti sewa dan data penghuni sewa/kos' },
    { id: 4, slug: 'view-finance', name: 'Lihat Keuangan Kas', module: 'keuangan', description: 'Melihat laporan transaksi kas dan iuran kas RT' },
    { id: 5, slug: 'manage-income', name: 'Kelola Pemasukan Kas', module: 'keuangan', description: 'Mencatat transaksi pemasukan kas RT' },
    { id: 6, slug: 'manage-expense', name: 'Kelola Pengeluaran Kas', module: 'keuangan', description: 'Mencatat draf rencana pengeluaran kas RT' },
    { id: 7, slug: 'approve-expense', name: 'Setujui Pengeluaran Kas', module: 'keuangan', description: 'Menyetujui atau menolak draf pengeluaran kas RT' },
    { id: 8, slug: 'manage-iuran', name: 'Kelola & Setor Iuran', module: 'keuangan', description: 'Mengatur tarif, menginisialisasi, dan menginput setoran iuran warga' },
    { id: 9, slug: 'manage-announcements', name: 'Kelola Pengumuman', module: 'pengumuman', description: 'Membuat, mengedit, dan menghapus pengumuman warga' },
    { id: 10, slug: 'manage-activities', name: 'Kelola Kegiatan', module: 'kegiatan', description: 'Mengelola agenda dan jadwal kegiatan warga RT' },
    { id: 11, slug: 'manage-complaints', name: 'Kelola Pengaduan Warga', module: 'laporan', description: 'Memproses dan memperbarui status laporan aduan warga' },
    { id: 12, slug: 'manage-users', name: 'Kelola User & Akun', module: 'pengguna', description: 'CRUD pengguna, reset password, suspend & mutasi peran' },
    { id: 13, slug: 'manage-roles', name: 'Kelola Role & Permission', module: 'pengguna', description: 'Mengatur matriks otorisasi dan hak akses permission role' },
    { id: 14, slug: 'view-audit-logs', name: 'Lihat Log Aktivitas Audit', module: 'pengguna', description: 'Melihat log riwayat aktivitas keamanan dan transaksi data' },
    { id: 15, slug: 'verify-registrations', name: 'Verifikasi Pendaftaran', module: 'verifikasi', description: 'Menyetujui pendaftaran akun warga mandiri' },
    { id: 16, slug: 'verify-documents', name: 'Verifikasi Berkas KK/KTP', module: 'verifikasi', description: 'Menyetujui unggahan berkas scan KK & KTP warga' },
    { id: 17, slug: 'manage-dwellings', name: 'Kelola Hunian & Alamat', module: 'hunian', description: 'Mengelola data alamat hunian dan cetak QR Code rumah' },
  ];

  for (const perm of permissionsData) {
    await db.insert(schema.permissions).values(perm);
  }

  // 3. Seed Role Permissions
  console.log('Seeding role permissions...');
  const rolePermissionsData: { id: number; roleId: number; permissionId: number }[] = [];
  let rpId = 1;

  // Super Admin (1 - 17)
  for (let p = 1; p <= 17; p++) {
    rolePermissionsData.push({ id: rpId++, roleId: 1, permissionId: p });
  }

  // Ketua RT (1, 2, 3, 4, 7, 8, 9, 10, 11, 15, 16, 17)
  const rtPerms = [1, 2, 3, 4, 7, 8, 9, 10, 11, 15, 16, 17];
  for (const p of rtPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 2, permissionId: p });
  }

  // Sekretaris (1, 9, 10, 11, 15, 16, 17)
  const sekPerms = [1, 9, 10, 11, 15, 16, 17];
  for (const p of sekPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 3, permissionId: p });
  }

  // Bendahara (4, 5, 6, 8)
  const bendPerms = [4, 5, 6, 8];
  for (const p of bendPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 4, permissionId: p });
  }

  // Koordinator Kost (3, 17)
  const kostPerms = [3, 17];
  for (const p of kostPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 5, permissionId: p });
  }

  // Warga (bebas akses warga)
  // (Tanpa permission pengurus khusus)

  for (const rp of rolePermissionsData) {
    await db.insert(schema.rolePermissions).values(rp);
  }

  // 4. Seed Default Super Admin User
  console.log('Seeding default Super Admin user...');
  const adminEmail = 'admin@wargaku.local';
  const plainPassword = 'admin123';
  const hashedPassword = await hashPassword(plainPassword);

  // Cek apakah admin sudah ada
  const existingAdmins = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, adminEmail));

  if (existingAdmins.length === 0) {
    // Tambahkan user
    await db.insert(schema.users).values({
      id: '1',
      name: 'Super Admin Utama',
      email: adminEmail,
      password: hashedPassword,
      roleId: 1, // Super Admin
      status: 'active',
    });

    // Tambahkan account credential untuk Better Auth
    await db.insert(schema.accounts).values({
      id: 'admin-credential-id',
      accountId: adminEmail,
      providerId: 'credential',
      userId: '1',
      password: hashedPassword,
    });

    console.log(`✅ Default Super Admin berhasil dibuat!`);
    console.log(`   Email   : ${adminEmail}`);
    console.log(`   Password: ${plainPassword}`);
  } else {
    console.log('ℹ️ User Super Admin sudah ada, melewati pembuatan user.');
  }

  console.log('🎉 Proses seeding selesai dengan sukses!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Gagal melakukan seeding:', err);
  process.exit(1);
});
