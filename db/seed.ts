import { db } from './index';
import * as schema from './schema';
import { hashPassword } from 'better-auth/crypto';
import { eq, ne } from 'drizzle-orm';

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

  // 5. Seed Dashboard Data (Warga, Aduan, Kas, Hunian)
  await seedDashboardData();

  console.log('🎉 Proses seeding selesai dengan sukses!');
  process.exit(0);
}

async function seedDashboardData() {
  console.log('🌱 Memulai seeding data dashboard (kependudukan, keuangan, aduan, hunian)...');

  // Hapus data lama untuk reset state
  console.log('Cleaning up existing tables...');
  await db.delete(schema.complaints);
  await db.delete(schema.feePayments);
  await db.delete(schema.feeRules);
  await db.delete(schema.cashTransactions);
  await db.delete(schema.rentalResidents);
  await db.delete(schema.rentalProperties);
  await db.delete(schema.familyMembers);
  await db.delete(schema.families);
  await db.delete(schema.notifications);
  await db.delete(schema.activityLogs);
  await db.delete(schema.smartGroups);
  await db.delete(schema.sessions).where(ne(schema.sessions.userId, '1'));
  await db.delete(schema.accounts).where(ne(schema.accounts.userId, '1'));
  await db.delete(schema.users).where(ne(schema.users.id, '1'));
  await db.delete(schema.dwellings);

  const hashedDefaultPassword = await hashPassword('password123');

  // 1. Seed Dwellings (15 units)
  console.log('Seeding dwellings...');
  const dwellingValues = [];
  
  // 10 Rumah Tetap (permanen)
  for (let i = 1; i <= 10; i++) {
    dwellingValues.push({
      id: i,
      blockNumber: String.fromCharCode(65 + (i % 3)), // A, B, C
      houseNumber: `${i * 3}`,
      type: 'permanen' as const,
      qrToken: `qr-dwelling-permanen-${i}`,
      isActive: true,
      ownerName: `Pemilik Tetap ${i}`,
    });
  }

  // 3 Kos / Kontrakan
  for (let i = 11; i <= 13; i++) {
    dwellingValues.push({
      id: i,
      blockNumber: 'D',
      houseNumber: `${i * 2}`,
      type: 'kos' as const,
      qrToken: `qr-dwelling-kos-${i}`,
      isActive: true,
      ownerName: `Pemilik Kos ${i - 10}`,
    });
  }

  // 2 Homestay
  for (let i = 14; i <= 15; i++) {
    dwellingValues.push({
      id: i,
      blockNumber: 'E',
      houseNumber: `${i + 5}`,
      type: 'homestay' as const,
      qrToken: `qr-dwelling-homestay-${i}`,
      isActive: true,
      ownerName: `Pemilik Homestay ${i - 13}`,
    });
  }

  for (const val of dwellingValues) {
    await db.insert(schema.dwellings).values(val);
  }

  // 2. Seed Users (RT, Bendahara, Sekretaris, Koordinator Kost, Warga)
  console.log('Seeding users...');
  
  // RT
  await db.insert(schema.users).values({
    id: 'rt-1',
    name: 'Ahmad Fauzi (RT)',
    email: 'rt@wargaku.local',
    password: hashedDefaultPassword,
    roleId: 2,
    status: 'active',
  });
  await db.insert(schema.accounts).values({
    id: 'rt-credential-id',
    accountId: 'rt@wargaku.local',
    providerId: 'credential',
    userId: 'rt-1',
    password: hashedDefaultPassword,
  });

  // Bendahara
  await db.insert(schema.users).values({
    id: 'bend-1',
    name: 'Budi Santoso (Bendahara)',
    email: 'bendahara@wargaku.local',
    password: hashedDefaultPassword,
    roleId: 4,
    status: 'active',
  });
  await db.insert(schema.accounts).values({
    id: 'bend-credential-id',
    accountId: 'bendahara@wargaku.local',
    providerId: 'credential',
    userId: 'bend-1',
    password: hashedDefaultPassword,
  });

  // Sekretaris
  await db.insert(schema.users).values({
    id: 'sek-1',
    name: 'Siti Aminah (Sekretaris)',
    email: 'sekretaris@wargaku.local',
    password: hashedDefaultPassword,
    roleId: 3,
    status: 'active',
  });
  await db.insert(schema.accounts).values({
    id: 'sek-credential-id',
    accountId: 'sekretaris@wargaku.local',
    providerId: 'credential',
    userId: 'sek-1',
    password: hashedDefaultPassword,
  });

  // Koordinator Kost
  await db.insert(schema.users).values({
    id: 'coord-1',
    name: 'Heri Kost',
    email: 'koordinator@wargaku.local',
    password: hashedDefaultPassword,
    roleId: 5,
    status: 'active',
  });
  await db.insert(schema.accounts).values({
    id: 'coord-credential-id',
    accountId: 'koordinator@wargaku.local',
    providerId: 'credential',
    userId: 'coord-1',
    password: hashedDefaultPassword,
  });

  // Warga Users (Heads of Families)
  for (let i = 1; i <= 8; i++) {
    await db.insert(schema.users).values({
      id: `warga-${i}`,
      name: `Kepala Keluarga ${i}`,
      email: `warga${i}@wargaku.local`,
      password: hashedDefaultPassword,
      roleId: 6,
      status: 'active',
    });
    await db.insert(schema.accounts).values({
      id: `warga-${i}-credential-id`,
      accountId: `warga${i}@wargaku.local`,
      providerId: 'credential',
      userId: `warga-${i}`,
      password: hashedDefaultPassword,
    });
  }

  // 3. Seed Families (8 active, 1 inactive)
  console.log('Seeding families...');
  const familiesData = [];
  
  // 8 Active Families
  for (let i = 1; i <= 8; i++) {
    const month = String((i % 5) + 1).padStart(2, '0');
    familiesData.push({
      id: i,
      dwellingId: i,
      familyNumber: `327301010101000${i}`,
      headUserId: `warga-${i}`,
      headName: `Kepala Keluarga ${i}`,
      verificationStatus: 'verified' as const,
      checkInDate: new Date(`2025-${month}-10`),
      isActive: true,
    });
  }
  
  // 1 Inactive Family (pindah)
  familiesData.push({
    id: 9,
    dwellingId: 9,
    familyNumber: '3273010101010009',
    headUserId: 'warga-8',
    headName: 'Kepala Keluarga Pindah',
    verificationStatus: 'verified' as const,
    checkInDate: new Date('2025-01-01'),
    checkOutDate: new Date('2026-05-15'),
    isActive: false,
  });

  for (const f of familiesData) {
    await db.insert(schema.families).values(f);
  }

  // 4. Seed Family Members (to populate demography statistics)
  console.log('Seeding family members...');
  const occupations = ['Karyawan Swasta', 'PNS', 'Wiraswasta', 'Pelajar', 'Mahasiswa', 'Ibu Rumah Tangga', 'Pensiunan', 'Tidak Bekerja'];
  const educationLevels = ['SD', 'SMP', 'SMA', 'Diploma', 'S1', 'S2/S3', 'Tidak Sekolah'];
  const religions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu'] as const;
  const genders = ['L', 'P'] as const;
  
  let memberId = 1;
  const familyMembersValues = [];

  // Seed members for each family
  for (let fId = 1; fId <= 8; fId++) {
    // 1. Kepala Keluarga
    familyMembersValues.push({
      id: memberId++,
      familyId: fId,
      name: `Kepala Keluarga ${fId}`,
      nik: `327301101010000${fId}`,
      birthDate: new Date(`198${fId}-05-12`),
      gender: 'L' as const,
      relationship: 'Kepala_Keluarga' as const,
      occupation: occupations[fId % occupations.length],
      educationLevel: educationLevels[fId % educationLevels.length],
      religion: religions[fId % religions.length],
      phone: `08123456780${fId}`,
      isActive: true,
    });

    // 2. Istri (Spouse)
    familyMembersValues.push({
      id: memberId++,
      familyId: fId,
      name: `Istri Keluarga ${fId}`,
      nik: `327301101010010${fId}`,
      birthDate: new Date(`19${80 + fId + 2}-08-20`),
      gender: 'P' as const,
      relationship: 'Istri' as const,
      occupation: fId % 3 === 0 ? 'Ibu Rumah Tangga' : occupations[(fId + 1) % occupations.length],
      educationLevel: educationLevels[(fId + 1) % educationLevels.length],
      religion: religions[fId % religions.length],
      isActive: true,
    });

    // 3. Anak 1 (Children)
    familyMembersValues.push({
      id: memberId++,
      familyId: fId,
      name: `Anak 1 Keluarga ${fId}`,
      nik: `327301101010020${fId}`,
      birthDate: new Date(`201${fId}-12-15`),
      gender: genders[fId % 2],
      relationship: 'Anak' as const,
      occupation: 'Pelajar',
      educationLevel: fId % 2 === 0 ? 'SD' : 'SMP',
      religion: religions[fId % religions.length],
      isActive: true,
    });

    // 4. Orang Tua / Lansia (Only for some families)
    if (fId % 3 === 0) {
      familyMembersValues.push({
        id: memberId++,
        familyId: fId,
        name: `Kakek/Nenek ${fId}`,
        nik: `327301101010030${fId}`,
        birthDate: new Date(`195${fId}-01-01`),
        gender: genders[(fId + 1) % 2],
        relationship: 'Orang_Tua' as const,
        occupation: 'Pensiunan',
        educationLevel: 'SMA',
        religion: religions[fId % religions.length],
        isActive: true,
      });
    }

    // 5. Balita (Only for some families)
    if (fId % 4 === 0) {
      familyMembersValues.push({
        id: memberId++,
        familyId: fId,
        name: `Balita Keluarga ${fId}`,
        nik: `327301101010040${fId}`,
        birthDate: new Date('2023-03-22'),
        gender: genders[fId % 2],
        relationship: 'Anak' as const,
        occupation: 'Tidak Bekerja',
        educationLevel: 'Tidak Sekolah',
        religion: religions[fId % religions.length],
        isActive: true,
      });
    }
  }

  // 1 Inactive Family Member (Pindah)
  familyMembersValues.push({
    id: memberId++,
    familyId: 9,
    name: 'Warga Pindah 1',
    nik: '3273011010100009',
    birthDate: new Date('1990-01-01'),
    gender: 'L' as const,
    relationship: 'Kepala_Keluarga' as const,
    occupation: 'Swasta',
    educationLevel: 'S1',
    religion: 'Islam' as const,
    isActive: false,
    inactiveReason: 'pindah' as const,
  });

  for (const val of familyMembersValues) {
    await db.insert(schema.familyMembers).values(val);
  }

  // 5. Seed Rental Properties (2 units)
  console.log('Seeding rental properties...');
  await db.insert(schema.rentalProperties).values({
    id: 1,
    dwellingId: 11,
    name: 'Wisma Merpati',
    coordinatorUserId: 'coord-1',
    contactPerson: 'Heri Kost',
    phone: '08567890123',
    totalRooms: 10,
    isActive: true,
  });

  await db.insert(schema.rentalProperties).values({
    id: 2,
    dwellingId: 12,
    name: 'Kost Bahagia',
    contactPerson: 'Susi Indah',
    phone: '08567890124',
    totalRooms: 5,
    isActive: true,
  });

  // 6. Seed Rental Residents (warga sewaan/pendatang)
  console.log('Seeding rental residents...');
  const rentalResidentsData = [
    {
      id: 1,
      rentalPropertyId: 1,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Kos A',
      nik: '3273012010100001',
      phone: '087712345601',
      originAddress: 'Bandung',
      occupation: 'Swasta',
      educationLevel: 'S1',
      religion: 'Islam' as const,
      roomNumber: 'A1',
      checkInDate: new Date('2026-02-10'),
      isActive: true,
      createdBy: 'coord-1',
    },
    {
      id: 2,
      rentalPropertyId: 1,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Kos B',
      nik: '3273012010100002',
      phone: '087712345602',
      originAddress: 'Jakarta',
      occupation: 'Swasta',
      educationLevel: 'S1',
      religion: 'Kristen' as const,
      roomNumber: 'A2',
      checkInDate: new Date('2026-03-01'),
      isActive: true,
      createdBy: 'coord-1',
    },
    {
      id: 3,
      rentalPropertyId: 1,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Kos C',
      nik: '3273012010100003',
      phone: '087712345603',
      originAddress: 'Surabaya',
      occupation: 'Mahasiswa',
      educationLevel: 'Diploma',
      religion: 'Katolik' as const,
      roomNumber: 'B1',
      checkInDate: new Date('2026-04-15'),
      isActive: true,
      createdBy: 'coord-1',
    },
    {
      id: 4,
      rentalPropertyId: 2,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Kos D',
      nik: '3273012010100004',
      phone: '087712345604',
      originAddress: 'Yogyakarta',
      occupation: 'Mahasiswa',
      educationLevel: 'SMA',
      religion: 'Islam' as const,
      roomNumber: '01',
      checkInDate: new Date('2026-05-01'),
      isActive: true,
      createdBy: 'rt-1',
    },
    {
      id: 5,
      rentalPropertyId: 2,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Kos E',
      nik: '3273012010100005',
      phone: '087712345605',
      originAddress: 'Solo',
      occupation: 'Swasta',
      educationLevel: 'S1',
      religion: 'Hindu' as const,
      roomNumber: '02',
      checkInDate: new Date('2026-05-20'),
      isActive: true,
      createdBy: 'rt-1',
    },
    {
      id: 6,
      rentalPropertyId: 1,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Keluar A',
      nik: '3273012010100006',
      phone: '087712345606',
      originAddress: 'Semarang',
      occupation: 'Swasta',
      educationLevel: 'S1',
      religion: 'Islam' as const,
      roomNumber: 'C1',
      checkInDate: new Date('2026-01-05'),
      checkOutDate: new Date('2026-04-30'),
      isActive: false,
      createdBy: 'coord-1',
    },
    {
      id: 7,
      rentalPropertyId: 2,
      tenantType: 'perorangan' as const,
      name: 'Penyewa Keluar B',
      nik: '3273012010100007',
      phone: '087712345607',
      originAddress: 'Malang',
      occupation: 'Swasta',
      educationLevel: 'Diploma',
      religion: 'Islam' as const,
      roomNumber: '03',
      checkInDate: new Date('2026-02-15'),
      checkOutDate: new Date('2026-06-10'),
      isActive: false,
      createdBy: 'rt-1',
    },
  ];

  for (const r of rentalResidentsData) {
    await db.insert(schema.rentalResidents).values(r);
  }

  // 7. Seed Fee Rules (Rules for monthly iuran)
  console.log('Seeding fee rules...');
  await db.insert(schema.feeRules).values({
    id: 1,
    rtId: 'rt-1',
    name: 'Iuran Wajib RT Bulanan',
    amount: '50000.00',
    isMandatory: true,
    createdBy: 'rt-1',
  });

  // 8. Seed Fee Payments (iuran bulanan for current period 2026-07)
  console.log('Seeding fee payments...');
  const currentPeriodStr = '2026-07';
  
  for (let fId = 1; fId <= 8; fId++) {
    const hasPaid = fId <= 6;
    await db.insert(schema.feePayments).values({
      id: fId,
      feeRuleId: 1,
      familyId: fId,
      period: currentPeriodStr,
      amountBilled: '50000.00',
      amountPaid: hasPaid ? '50000.00' : '0.00',
      paymentDate: hasPaid ? new Date('2026-07-05') : null,
      paymentMethod: hasPaid ? 'transfer' as const : null,
      status: hasPaid ? 'paid' as const : 'unpaid' as const,
      isMandatory: true,
      recordedBy: hasPaid ? 'bend-1' : null,
    });
  }

  // 9. Seed Cash Transactions (pemasukan & pengeluaran past 6 months)
  console.log('Seeding cash transactions...');
  const monthlyTrans = [];
  let transId = 1;

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const month = String(7 - monthOffset).padStart(2, '0');
    const dateStr = `2026-${month}-01`;
    
    monthlyTrans.push({
      id: transId++,
      type: 'income' as const,
      amount: '300000.00', // 6 KK * 50,000 paid
      transactionDate: new Date(dateStr),
      category: 'Iuran Wajib',
      description: `Penerimaan iuran warga bulanan`,
      status: 'approved' as const,
      createdBy: 'bend-1',
      approvedBy: 'rt-1',
    });

    if (monthOffset % 2 === 0) {
      monthlyTrans.push({
        id: transId++,
        type: 'income' as const,
        amount: '500000.00',
        transactionDate: new Date(`2026-${month}-05`),
        category: 'Donasi',
        description: `Sumbangan sosial warga`,
        status: 'approved' as const,
        createdBy: 'bend-1',
        approvedBy: 'rt-1',
      });
    }

    monthlyTrans.push({
      id: transId++,
      type: 'expense' as const,
      amount: '150000.00',
      transactionDate: new Date(`2026-${month}-15`),
      category: 'Keamanan',
      description: `Honor bulanan petugas keamanan RT`,
      status: 'approved' as const,
      createdBy: 'bend-1',
      approvedBy: 'rt-1',
    });

    monthlyTrans.push({
      id: transId++,
      type: 'expense' as const,
      amount: '100000.00',
      transactionDate: new Date(`2026-${month}-20`),
      category: 'Kebersihan',
      description: `Biaya pengangkutan sampah wilayah RT`,
      status: 'approved' as const,
      createdBy: 'bend-1',
      approvedBy: 'rt-1',
    });

    if (monthOffset === 1) { // June 2026
      monthlyTrans.push({
        id: transId++,
        type: 'expense' as const,
        amount: '300000.00',
        transactionDate: new Date('2026-06-25'),
        category: 'Sosial',
        description: 'Bantuan kedukaan warga meninggal dunia',
        status: 'approved' as const,
        createdBy: 'bend-1',
        approvedBy: 'rt-1',
      });
    }
  }

  for (const t of monthlyTrans) {
    await db.insert(schema.cashTransactions).values(t);
  }

  // 10. Seed Complaints (laporan aduan warga)
  console.log('Seeding complaints...');
  const complaintsData = [
    {
      id: 1,
      trackingCode: 'ADU-2026071501',
      reporterName: 'Kepala Keluarga 3',
      reporterPhone: '081234567803',
      category: 'Kebersihan' as const,
      description: 'Pengangkutan sampah di gang B terlambat 3 hari, menyebabkan bau tidak sedap.',
      dwellingId: 3,
      status: 'selesai' as const,
      responseNote: 'Sudah dikoordinasikan dengan petugas kebersihan setempat dan sampah telah diangkut pada tanggal 16 Juli.',
      handledBy: 'rt-1',
      createdAt: new Date('2026-07-15T08:30:00Z'),
      resolvedAt: new Date('2026-07-16T15:00:00Z'),
    },
    {
      id: 2,
      trackingCode: 'ADU-2026071801',
      reporterName: 'Kepala Keluarga 5',
      reporterPhone: '081234567805',
      category: 'Keamanan' as const,
      description: 'Lampu jalan dekat pos ronda mati, jalanan menjadi gelap di malam hari.',
      dwellingId: 5,
      status: 'proses' as const,
      responseNote: 'Sudah dibelikan bohlam pengganti, akan segera dipasang oleh petugas malam ini.',
      handledBy: 'rt-1',
      createdAt: new Date('2026-07-18T19:45:00Z'),
    },
    {
      id: 3,
      trackingCode: 'ADU-2026071901',
      reporterName: 'Penyewa Kos B',
      reporterPhone: '087712345602',
      category: 'Lainnya' as const,
      description: 'Ada kabel melintang terlalu rendah di depan gerbang Wisma Merpati, membahayakan pengendara motor.',
      dwellingId: 11,
      status: 'menunggu' as const,
      createdAt: new Date('2026-07-19T10:15:00Z'),
    },
    {
      id: 4,
      trackingCode: 'ADU-2026072001',
      reporterName: 'Kepala Keluarga 2',
      reporterPhone: '081234567802',
      category: 'Kebersihan' as const,
      description: 'Saluran air di gang C mampet, ada tumpukan lumpur tebal.',
      dwellingId: 2,
      status: 'menunggu' as const,
      createdAt: new Date('2026-07-20T09:00:00Z'),
    },
  ];

  for (const c of complaintsData) {
    await db.insert(schema.complaints).values(c);
  }

  console.log('✅ Seeding data dashboard selesai dengan sukses!');
}

main().catch((err) => {
  console.error('❌ Gagal melakukan seeding:', err);
  process.exit(1);
});
