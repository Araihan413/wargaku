import {
  mysqlTable,
  varchar,
  text,
  mysqlEnum,
  timestamp,
  boolean,
  int,
  decimal,
  date,
  datetime,
  json,
  unique,
  index,
} from 'drizzle-orm/mysql-core';

// ==========================================
// 1. MODUL AUTENTIKASI & RBAC (USER, ROLE, PERMISSION)
// ==========================================

// 1.1 Users (Dibersihkan dari redundansi)
export const users = mysqlTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  email: varchar('email', { length: 100 }).notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: varchar('image', { length: 255 }),
  password: varchar('password', { length: 255 }),
  phone: varchar('phone', { length: 15 }),
  photo: varchar('photo', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'active', 'suspended']).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  statusIdx: index('users_status_idx').on(table.status),
}));

// 1.2 Roles
export const roles = mysqlTable('roles', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  description: text('description'),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 1.3 Permissions
export const permissions = mysqlTable('permissions', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  module: varchar('module', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  moduleIdx: index('permissions_module_idx').on(table.module),
}));

// 1.4 Role Permissions (Many-to-Many)
export const rolePermissions = mysqlTable('role_permissions', {
  id: int('id').autoincrement().primaryKey(),
  roleId: int('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  permissionId: int('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueRolePermIdx: unique('unique_role_perm_idx').on(table.roleId, table.permissionId),
}));

// 1.5 User Roles (Many-to-Many Multi-Role)
export const userRoles = mysqlTable('user_roles', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleId: int('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').notNull().default(false),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUserRoleIdx: unique('unique_user_role_idx').on(table.userId, table.roleId),
  userIdIdx: index('user_roles_user_id_idx').on(table.userId),
  roleIdIdx: index('user_roles_role_id_idx').on(table.roleId),
}));

// ==========================================
// 2. MODUL KEPENDUDUKAN & HUNIAN
// ==========================================

// 2.1 Dwellings (Unit Fisik Rumah)
export const dwellings = mysqlTable('dwellings', {
  id: int('id').autoincrement().primaryKey(),
  blockNumber: varchar('block_number', { length: 20 }).notNull(),
  houseNumber: varchar('house_number', { length: 20 }).notNull(),
  ownerUserId: varchar('owner_user_id', { length: 255 }).references(() => users.id),
  qrToken: varchar('qr_token', { length: 100 }).notNull().unique(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  type: mysqlEnum('type', ['permanen', 'kos', 'homestay']).notNull().default('permanen'),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueAddressIdx: unique('unique_address_idx').on(table.blockNumber, table.houseNumber),
  ownerUserIdx: index('dwellings_owner_user_idx').on(table.ownerUserId),
  typeIdx: index('dwellings_type_idx').on(table.type),
  qrTokenIdx: index('dwellings_qr_token_idx').on(table.qrToken),
}));

// 2.2 Families (Unit Keluarga/KK - untuk Warga Tetap & Penyewa Rumah)
export const families = mysqlTable('families', {
  id: int('id').autoincrement().primaryKey(),
  dwellingId: int('dwelling_id').references(() => dwellings.id, { onDelete: 'set null' }),
  headUserId: varchar('head_user_id', { length: 255 }).references(() => users.id),
  familyNumber: varchar('family_number', { length: 20 }).notNull().unique(),
  kkFile: varchar('kk_file', { length: 255 }),
  verificationStatus: mysqlEnum('verification_status', ['draft', 'pending', 'verified', 'rejected', 'changes_pending']).notNull().default('draft'),
  verificationNote: text('verification_note'),
  draftOpenedAt: timestamp('draft_opened_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  dwellingIdx: index('families_dwelling_idx').on(table.dwellingId),
  headUserIdx: index('families_head_user_idx').on(table.headUserId),
  verificationStatusIdx: index('families_verification_status_idx').on(table.verificationStatus),
  familyNumberIdx: index('families_family_number_idx').on(table.familyNumber),
  isActiveIdx: index('families_is_active_idx').on(table.isActive),
}));

// 2.3 Family Members (Anggota Keluarga - Pengganti residents untuk tipe warga)
export const familyMembers = mysqlTable('family_members', {
  id: int('id').autoincrement().primaryKey(),
  familyId: int('family_id').notNull().references(() => families.id, { onDelete: 'cascade' }),
  userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 100 }).notNull(),
  nik: varchar('nik', { length: 16 }).notNull().unique(),
  gender: mysqlEnum('gender', ['L', 'P']).notNull(),
  birthPlace: varchar('birth_place', { length: 50 }),
  birthDate: date('birth_date'),
  phone: varchar('phone', { length: 15 }),
  relationship: mysqlEnum('relationship', ['Kepala_Keluarga', 'Suami', 'Istri', 'Anak', 'Orang_Tua', 'Mertua', 'Sepupu', 'Lainnya']).notNull(),
  occupation: varchar('occupation', { length: 50 }),
  educationLevel: varchar('education_level', { length: 50 }),
  religion: mysqlEnum('religion', ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Khonghucu', 'Lainnya']),
  ktpFile: varchar('ktp_file', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  familyIdx: index('family_members_family_idx').on(table.familyId),
  userIdIdx: index('family_members_user_idx').on(table.userId),
  relationshipIdx: index('family_members_relationship_idx').on(table.relationship),
}));

// 2.4 Rental Properties (Properti Komersial Kos/Homestay)
export const rentalProperties = mysqlTable('rental_properties', {
  id: int('id').autoincrement().primaryKey(),
  dwellingId: int('dwelling_id').notNull().references(() => dwellings.id),
  name: varchar('name', { length: 100 }).notNull(),
  coordinatorUserId: varchar('coordinator_user_id', { length: 255 }).references(() => users.id),
  contactPerson: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 15 }),
  totalRooms: int('total_rooms').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  dwellingIdx: index('rental_properties_dwelling_idx').on(table.dwellingId),
  coordinatorIdx: index('rental_properties_coordinator_idx').on(table.coordinatorUserId),
  isActiveIdx: index('rental_properties_is_active_idx').on(table.isActive),
}));

// 2.5 Rental Contracts (Kontrak Sewa - Pengganti residents untuk tipe sewa)
export const rentalContracts = mysqlTable('rental_contracts', {
  id: int('id').autoincrement().primaryKey(),
  rentalPropertyId: int('rental_property_id').notNull().references(() => rentalProperties.id),
  roomNumber: varchar('room_number', { length: 10 }).notNull(),
  tenantType: mysqlEnum('tenant_type', ['individual', 'family']).notNull(),
  familyId: int('family_id').references(() => families.id, { onDelete: 'set null' }),
  userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  individualName: varchar('individual_name', { length: 100 }),
  individualNik: varchar('individual_nik', { length: 16 }),
  individualGender: mysqlEnum('individual_gender', ['L', 'P']),
  individualBirthPlace: varchar('individual_birth_place', { length: 50 }),
  individualBirthDate: date('individual_birth_date'),
  individualPhone: varchar('individual_phone', { length: 15 }),
  individualKtpFile: varchar('individual_ktp_file', { length: 255 }),
  checkInDate: date('check_in_date').notNull(),
  checkOutDate: date('check_out_date'),
  checkOutNote: text('check_out_note'),
  verificationStatus: mysqlEnum('verification_status', ['pending', 'verified', 'rejected']).notNull().default('pending'),
  verificationNote: text('verification_note'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  rentalPropertyIdx: index('rental_contracts_property_idx').on(table.rentalPropertyId),
  familyIdx: index('rental_contracts_family_idx').on(table.familyId),
  userIdIdx: index('rental_contracts_user_idx').on(table.userId),
  tenantTypeIdx: index('rental_contracts_tenant_type_idx').on(table.tenantType),
  verificationStatusIdx: index('rental_contracts_verification_status_idx').on(table.verificationStatus),
  isActiveIdx: index('rental_contracts_is_active_idx').on(table.isActive),
  checkInDateIdx: index('rental_contracts_check_in_idx').on(table.checkInDate),
  individualNikIdx: index('rental_contracts_individual_nik_idx').on(table.individualNik),
}));

// ==========================================
// 3. MODUL KEUANGAN & IURAN
// ==========================================

// 3.1 Cash Transactions (Kas RT)
export const cashTransactions = mysqlTable('cash_transactions', {
  id: int('id').autoincrement().primaryKey(),
  type: mysqlEnum('type', ['income', 'expense']).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  receiptFile: varchar('receipt_file', { length: 255 }),
  status: mysqlEnum('status', ['pending', 'approved']).notNull().default('approved'),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  approvedBy: varchar('approved_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  transactionDateIdx: index('cash_transactions_date_idx').on(table.transactionDate),
  typeIdx: index('cash_transactions_type_idx').on(table.type),
  statusIdx: index('cash_transactions_status_idx').on(table.status),
}));

// 3.2 Fee Rules (Aturan Iuran)
export const feeRules = mysqlTable('fee_rules', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 3.3 Fee Payments (Pembayaran Iuran per KK)
export const feePayments = mysqlTable('fee_payments', {
  id: int('id').autoincrement().primaryKey(),
  feeRuleId: int('fee_rule_id').notNull().references(() => feeRules.id),
  familyId: int('family_id').notNull().references(() => families.id),
  period: varchar('period', { length: 7 }).notNull(), // YYYY-MM
  amountBilled: decimal('amount_billed', { precision: 15, scale: 2 }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 15, scale: 2 }).notNull().default('0.00'),
  paymentDate: date('payment_date'),
  paymentMethod: mysqlEnum('payment_method', ['cash', 'transfer']),
  status: mysqlEnum('status', ['unpaid', 'partially_paid', 'paid']).notNull().default('unpaid'),
  isMandatory: boolean('is_mandatory').notNull().default(true),
  recordedBy: varchar('recorded_by', { length: 255 }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  familyIdx: index('fee_payments_family_idx').on(table.familyId),
  feeRuleIdx: index('fee_payments_rule_idx').on(table.feeRuleId),
  periodIdx: index('fee_payments_period_idx').on(table.period),
  statusIdx: index('fee_payments_status_idx').on(table.status),
  uniquePaymentIdx: unique('unique_fee_payment_idx').on(table.feeRuleId, table.familyId, table.period),
}));

// ==========================================
// 4. MODUL KOMUNIKASI & PARTISIPASI
// ==========================================

// 4.1 Announcements
export const announcements = mysqlTable('announcements', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  category: mysqlEnum('category', ['umum', 'penting', 'mendesak']).notNull(),
  attachments: text('attachments'),
  isPinned: boolean('is_pinned').notNull().default(false),
  pinUntil: timestamp('pin_until'),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  publishedAt: timestamp('published_at').defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  createdByIdx: index('announcements_created_by_idx').on(table.createdBy),
  isPinnedIdx: index('announcements_is_pinned_idx').on(table.isPinned),
  categoryIdx: index('announcements_category_idx').on(table.category),
  publishedAtIdx: index('announcements_published_at_idx').on(table.publishedAt),
}));

// 4.2 Activities
export const activities = mysqlTable('activities', {
  id: int('id').autoincrement().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  eventDate: datetime('event_date').notNull(),
  location: varchar('location', { length: 255 }),
  attachments: text('attachments'),
  isPinned: boolean('is_pinned').notNull().default(false),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  eventDateIdx: index('activities_event_date_idx').on(table.eventDate),
  createdByIdx: index('activities_created_by_idx').on(table.createdBy),
}));

// 4.3 Complaints
export const complaints = mysqlTable('complaints', {
  id: int('id').autoincrement().primaryKey(),
  trackingCode: varchar('tracking_code', { length: 20 }).notNull().unique(),
  reporterName: varchar('reporter_name', { length: 100 }).notNull(),
  reporterPhone: varchar('reporter_phone', { length: 15 }),
  category: mysqlEnum('category', ['Infrastruktur', 'Kebersihan', 'Keamanan', 'Sosial', 'Lainnya']).notNull(),
  description: text('description').notNull(),
  photoPath: text('photo_path'),
  dwellingId: int('dwelling_id').references(() => dwellings.id),
  status: mysqlEnum('status', ['menunggu', 'proses', 'selesai', 'ditolak']).notNull().default('menunggu'),
  responseNote: text('response_note'),
  handledBy: varchar('handled_by', { length: 255 }).references(() => users.id),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
}, (table) => ({
  trackingIdx: index('complaints_tracking_idx').on(table.trackingCode),
  statusIdx: index('complaints_status_idx').on(table.status),
  dwellingIdx: index('complaints_dwelling_idx').on(table.dwellingId),
  categoryIdx: index('complaints_category_idx').on(table.category),
  createdAtIdx: index('complaints_created_at_idx').on(table.createdAt),
}));

// 4.4 Notifications
export const notifications = mysqlTable('notifications', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 150 }).notNull(),
  message: text('message').notNull(),
  category: mysqlEnum('category', ['personal', 'dinas']).notNull(),
  isRead: boolean('is_read').notNull().default(false),
  redirectLink: varchar('redirect_link', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('notifications_user_id_idx').on(table.userId),
  index('notifications_user_is_read_idx').on(table.userId, table.isRead),
  index('notifications_created_at_idx').on(table.createdAt),
]);

// ==========================================
// 5. MODUL AUDIT & SISTEM
// ==========================================

// 5.1 Activity Logs
export const activityLogs = mysqlTable('activity_logs', {
  id: int('id').autoincrement().primaryKey(),
  userId: varchar('user_id', { length: 255 }).references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 50 }).notNull(),
  module: varchar('module', { length: 50 }).notNull(),
  description: text('description'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index('activity_logs_created_at_idx').on(table.createdAt),
  userIdIdx: index('activity_logs_user_id_idx').on(table.userId),
  moduleIdx: index('activity_logs_module_idx').on(table.module),
}));

// 5.2 System Settings (Single Row)
export const systemSettings = mysqlTable('system_settings', {
  id: int('id').primaryKey(), // Selalu 1
  rtName: varchar('rt_name', { length: 50 }).notNull(),
  rwName: varchar('rw_name', { length: 50 }).notNull(),
  villageName: varchar('village_name', { length: 100 }).notNull(),
  subdistrict: varchar('subdistrict', { length: 100 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  secretariatAddress: text('secretariat_address'),
  logoPath: varchar('logo_path', { length: 255 }),
  officialEmail: varchar('official_email', { length: 100 }),
  officialRtPhone: varchar('official_rt_phone', { length: 15 }),
  officialSecretaryPhone: varchar('official_secretary_phone', { length: 15 }),
  officialTreasurerPhone: varchar('official_treasurer_phone', { length: 15 }),
  emergencyContacts: json('emergency_contacts').$type<{ id?: string; name: string; phone: string; subtitle?: string }[]>(),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 5.3 Smart Groups (Dynamic Filtering)
export const smartGroups = mysqlTable('smart_groups', {
  id: int('id').autoincrement().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  queryRules: json('query_rules').notNull(),
  createdBy: varchar('created_by', { length: 255 }).notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// 6. MODUL BETTER AUTH (Jangan diubah)
// ==========================================

export const sessions = mysqlTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

export const accounts = mysqlTable('accounts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  expiresAt: timestamp('expires_at'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerIdx: index('accounts_provider_idx').on(table.providerId),
}));

export const verifications = mysqlTable('verifications', {
  id: varchar('id', { length: 255 }).primaryKey(),
  identifier: varchar('identifier', { length: 255 }).notNull(),
  value: varchar('value', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  identifierIdx: index('verifications_identifier_idx').on(table.identifier),
}));

export const accountActivationTokens = mysqlTable('activation_tokens', {
  id: int('id').autoincrement().primaryKey(),
  token: varchar('token', { length: 100 }).notNull().unique(),
  email: varchar('email', { length: 100 }).notNull(),
  nik: varchar('nik', { length: 16 }).notNull(),
  rentalContractId: int('rental_contract_id').references(() => rentalContracts.id, { onDelete: 'cascade' }),
  familyId: int('family_id').references(() => families.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  isUsed: boolean('is_used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tokenIdx: index('activation_tokens_token_idx').on(table.token),
  emailIdx: index('activation_tokens_email_idx').on(table.email),
  nikIdx: index('activation_tokens_nik_idx').on(table.nik),
}));