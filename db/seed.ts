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
  const permissionsData = [
    { id: 1, slug: 'view-residents', name: 'Lihat Data Warga', module: 'kependudukan', description: 'Melihat seluruh data warga kependudukan' },
    { id: 2, slug: 'manage-residents', name: 'Kelola Data Warga', module: 'kependudukan', description: 'Membuat, memperbarui, dan menghapus data warga tetap' },
    { id: 3, slug: 'manage-boarding', name: 'Kelola Kos & Penghuni', module: 'kependudukan', description: 'Mengelola properti sewa dan data penghuni sewa/kos' },
    { id: 4, slug: 'view-finance', name: 'Lihat Keuangan', module: 'keuangan', description: 'Melihat laporan dan riwayat kas keuangan' },
    { id: 5, slug: 'manage-income', name: 'Kelola Pemasukan', module: 'keuangan', description: 'Mencatat pemasukan kas' },
    { id: 6, slug: 'manage-expense', name: 'Kelola Pengeluaran', module: 'keuangan', description: 'Mencatat rencana pengeluaran kas' },
    { id: 7, slug: 'approve-expense', name: 'Setujui Pengeluaran', module: 'keuangan', description: 'Menyetujui atau menolak catatan pengeluaran Bendahara' },
    { id: 8, slug: 'manage-announcements', name: 'Kelola Pengumuman', module: 'pengumuman', description: 'Membuat, mengedit, dan menghapus pengumuman' },
    { id: 9, slug: 'manage-activities', name: 'Kelola Kegiatan', module: 'kegiatan', description: 'Mengelola jadwal kegiatan warga' },
    { id: 10, slug: 'manage-letters', name: 'Kelola Surat', module: 'surat', description: 'Membuat dan memproses pengajuan surat pengantar' },
    { id: 11, slug: 'approve-letters', name: 'Setujui Surat', module: 'surat', description: 'Mengesahkan dan menandatangani surat pengantar' },
    { id: 12, slug: 'manage-complaints', name: 'Kelola Laporan/Aduan', module: 'laporan', description: 'Mengelola dan merespon pengaduan warga' },
    { id: 13, slug: 'manage-users', name: 'Kelola User', module: 'pengguna', description: 'Mengelola akun pengguna sistem' },
    { id: 14, slug: 'manage-roles', name: 'Kelola Role & Izin', module: 'pengguna', description: 'Mengatur hak akses dan permission role' },
    { id: 15, slug: 'verify-registrations', name: 'Verifikasi Pendaftaran', module: 'verifikasi', description: 'Menyetujui registrasi mandiri akun warga' },
    { id: 16, slug: 'verify-documents', name: 'Verifikasi KK/KTP', module: 'verifikasi', description: 'Verifikasi unggahan berkas KK dan KTP warga' },
    { id: 17, slug: 'manage-own-family', name: 'Kelola Data Keluarga Sendiri', module: 'keluarga', description: 'Mengubah biodata keluarga sendiri sebagai warga' },
    { id: 18, slug: 'view-dwelling-details', name: 'Lihat Detail Hunian', module: 'hunian', description: 'Melihat info detail hunian via scan QR' },
    { id: 19, slug: 'manage-dwellings', name: 'Kelola Hunian', module: 'hunian', description: 'Membuat dan mengelola data alamat & koordinat hunian' },
  ];

  for (const perm of permissionsData) {
    await db.insert(schema.permissions).values(perm).onDuplicateKeyUpdate({
      set: {
        name: perm.name,
        slug: perm.slug,
        module: perm.module,
        description: perm.description,
      },
    });
  }

  // 3. Seed Role Permissions
  console.log('Seeding role permissions...');
  // Hapus mapping lama untuk mencegah inkonsistensi sebelum seed baru
  // (Karena ini tabel pivot sederhana, kita bisa kosongkan lalu isi ulang)
  // Menghindari duplikasi id
  const rolePermissionsData: { id: number; roleId: number; permissionId: number }[] = [];
  let rpId = 1;

  // Super Admin (Semua permission 1 - 19)
  for (let p = 1; p <= 19; p++) {
    rolePermissionsData.push({ id: rpId++, roleId: 1, permissionId: p });
  }

  // Ketua RT (1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19)
  const rtPerms = [1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19];
  for (const p of rtPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 2, permissionId: p });
  }

  // Sekretaris (1, 8, 9, 10, 12, 15, 16, 17, 18)
  const sekPerms = [1, 8, 9, 10, 12, 15, 16, 17, 18];
  for (const p of sekPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 3, permissionId: p });
  }

  // Bendahara (4, 5, 6, 17)
  const bendPerms = [4, 5, 6, 17];
  for (const p of bendPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 4, permissionId: p });
  }

  // Koordinator Kost (3, 17)
  const kostPerms = [3, 17];
  for (const p of kostPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 5, permissionId: p });
  }

  // Warga (4, 17, 18)
  const wargaPerms = [4, 17, 18];
  for (const p of wargaPerms) {
    rolePermissionsData.push({ id: rpId++, roleId: 6, permissionId: p });
  }

  for (const rp of rolePermissionsData) {
    await db.insert(schema.rolePermissions).values(rp).onDuplicateKeyUpdate({
      set: {
        roleId: rp.roleId,
        permissionId: rp.permissionId,
      },
    });
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
