import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne, like, sql } from 'drizzle-orm';

import { sendEmail } from './mail';
import { getWargaRegistrationEmail, getResetPasswordEmail } from './emails/templates';
import { notifyRoles } from './notifications';
import { createAuditLog } from '@/db/queries/system/audit-log.queries';

export const auth = betterAuth({
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
    session: {
      create: {
        after: async (session) => {
          try {
            const [u] = await db
              .select({
                name: schema.users.name,
                email: schema.users.email,
                roleId: schema.userRoles.roleId,
              })
              .from(schema.users)
              .leftJoin(schema.userRoles, and(eq(schema.users.id, schema.userRoles.userId), eq(schema.userRoles.isPrimary, true)))
              .where(eq(schema.users.id, session.userId));

            if (u) {
              await createAuditLog({
                userId: session.userId,
                action: "LOGIN_SUCCESS",
                module: "auth",
                description: `Pengguna ${u.name} (${u.email}) berhasil login ke sistem (Role ID #${u.roleId || 6})`,
                ipAddress: session.ipAddress || null,
              });
            }
          } catch (err) {
            console.error("Gagal mencatat audit log LOGIN_SUCCESS:", err);
          }
        },
      },
    },
    user: {
      create: {
        after: async (user) => {
          try {
            // Auto-assign user_roles
            const rId = typeof (user as any).roleId === 'number' ? (user as any).roleId : 6;
            await db.insert(schema.userRoles).values({
              userId: user.id,
              roleId: rId,
              isPrimary: true,
            }).onDuplicateKeyUpdate({ set: { id: sql`id` } });

          } catch (err) {
            console.error("Gagal auto-assign user_roles:", err);
          }

          const status = (user as any).status || 'pending';
          const rId = typeof (user as any).roleId === 'number' ? (user as any).roleId : 6;
          if (rId === 6 && status === 'pending') {
            try {
              // 1. Kirim notifikasi internal ke Ketua RT & Sekretaris
              await notifyRoles(["ketua-rt", "sekretaris"], {
                title: "Pendaftaran Warga Baru",
                message: `Warga bernama ${user.name} telah mendaftar dan menunggu persetujuan Anda.`,
                category: "dinas",
                redirectLink: `/dashboard/approvals/registration`,
              });

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
    additionalFields: {
      phone: { type: 'string', required: false },
      photo: { type: 'string', required: false },
      status: { type: 'string', required: true, defaultValue: 'pending' },
    },
  },
});
