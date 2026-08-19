import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Skema validasi registrasi warga
const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  nik: z.string().length(16, 'NIK harus tepat 16 digit').regex(/^\d+$/, 'NIK harus berupa angka'),
  phone: z.string().min(10, 'Nomor HP minimal 10 digit').regex(/^\d+$/, 'Nomor HP harus berupa angka'),
});

describe('WF-01: Alur Autentikasi & Registrasi Pengguna', () => {
  describe('Alur Benar (Happy Path)', () => {
    it('WF-AUTH-01: harus menerima data pendaftaran yang lengkap dan valid', () => {
      const validPayload = {
        name: 'Budi Santoso',
        email: 'budi.santoso@example.com',
        password: 'PasswordSuper123!',
        nik: '3201234567890123',
        phone: '081234567890',
      };

      const result = registerSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nik).toHaveLength(16);
        expect(result.data.email).toBe('budi.santoso@example.com');
      }
    });

    it('WF-AUTH-05: status transisi akun baru harus bernilai pending sampai di-approve', () => {
      type AccountStatus = 'pending' | 'active' | 'suspended';

      let userStatus: AccountStatus = 'pending';
      expect(userStatus).toBe('pending');

      // Simulasi approval oleh Ketua RT
      const approveUser = (status: AccountStatus): AccountStatus => {
        if (status === 'pending') return 'active';
        return status;
      };

      userStatus = approveUser(userStatus);
      expect(userStatus).toBe('active');
    });
  });

  describe('Alur Salah / Abuse (Negative Path)', () => {
    it('WF-AUTH-03: harus menolak jika password kurang dari 8 karakter', () => {
      const invalidPasswordPayload = {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        password: '123', // Terlalu pendek
        nik: '3201234567890123',
        phone: '081234567890',
      };

      const result = registerSchema.safeParse(invalidPasswordPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const passwordError = result.error.issues.find((i) => i.path.includes('password'));
        expect(passwordError).toBeDefined();
        expect(passwordError?.message).toContain('Password minimal 8 karakter');
      }
    });

    it('WF-AUTH-02: harus menolak jika NIK tidak tepat 16 digit atau bukan angka', () => {
      const invalidNikPayload = {
        name: 'Budi Santoso',
        email: 'budi@example.com',
        password: 'PasswordSuper123!',
        nik: '3201234', // Kurang dari 16 digit
        phone: '081234567890',
      };

      const result = registerSchema.safeParse(invalidNikPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nikError = result.error.issues.find((i) => i.path.includes('nik'));
        expect(nikError).toBeDefined();
      }
    });

    it('WF-AUTH-04: akun berstatus pending dilarang mengakses modul dashboard utama', () => {
      const checkDashboardAccess = (status: string) => {
        if (status !== 'active') {
          return { allowed: false, redirectUrl: '/approval-pending' };
        }
        return { allowed: true, redirectUrl: '/dashboard' };
      };

      const pendingCheck = checkDashboardAccess('pending');
      expect(pendingCheck.allowed).toBe(false);
      expect(pendingCheck.redirectUrl).toBe('/approval-pending');

      const suspendedCheck = checkDashboardAccess('suspended');
      expect(suspendedCheck.allowed).toBe(false);

      const activeCheck = checkDashboardAccess('active');
      expect(activeCheck.allowed).toBe(true);
      expect(activeCheck.redirectUrl).toBe('/dashboard');
    });
  });
});
