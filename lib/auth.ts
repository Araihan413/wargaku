import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne, like } from 'drizzle-orm';
import { sendEmail } from './mail';
import { getWargaRegistrationEmail, getResetPasswordEmail } from './emails/templates';

export const auth = betterAuth({
  // beritahu untuk berkomunikasi dengan mysql
  database: drizzleAdapter(db, {
    provider: 'mysql',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (user.roleId === 6 && user.status === 'pending') {
            try {
              // 1. Kirim notifikasi internal ke Ketua RT
              const rts = await db
                .select({ id: schema.users.id })
                .from(schema.users)
                .where(eq(schema.users.roleId, 2));

              if (rts.length > 0) {
                const insertPromises = rts.map((rt) =>
                  db.insert(schema.notifications).values({
                    userId: rt.id,
                    title: "Pendaftaran Warga Baru",
                    message: `Warga bernama ${user.name} telah mendaftar dan menunggu persetujuan Anda.`,
                    category: "dinas",
                    redirectLink: `/dashboard/approvals/registration`,
                  })
                );
                await Promise.all(insertPromises);
              }

              // 2. Kirim email konfirmasi ke Warga
              const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";
              const loginLink = `${appUrl}/login`;

              await sendEmail({
                to: { email: user.email, name: user.name },
                subject: "Pendaftaran Akun Wargaku Berhasil",
                htmlContent: getWargaRegistrationEmail(user.name, loginLink),
              });
            } catch (err) {
              console.error("Gagal mengirim notifikasi registrasi warga ke RT atau email warga:", err);
            }
          }
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      try {
        // Invalidasi/hapus token reset password lama milik user ini agar link sebelumnya otomatis hangus
        await db
          .delete(schema.verifications)
          .where(
            and(
              eq(schema.verifications.value, user.id),
              like(schema.verifications.identifier, 'reset-password:%'),
              ne(schema.verifications.identifier, `reset-password:${token}`)
            )
          );

        await sendEmail({
          to: { email: user.email, name: user.name },
          subject: "Reset Kata Sandi Akun Wargaku",
          htmlContent: getResetPasswordEmail(user.name, url),
        });
      } catch (err) {
        console.error("Gagal mengirim email reset password:", err);
      }
    },
  },
  user: {
    // menambah kolom sesuai kabutuhan
    additionalFields: {
      nik: { type: 'string', required: false },
      phone: { type: 'string', required: false },
      photo: { type: 'string', required: false },
      roleId: { type: 'number', required: true },
      status: { type: 'string', required: true, defaultValue: 'pending' },
      familyNumber: { type: 'string', required: false },
      dwellingId: { type: 'number', required: false },
      unitNumber: { type: 'string', required: false },
    },
  },
});
