import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq, and, ne, like } from 'drizzle-orm';
import { sendEmail } from './mail';
import { getResetPasswordEmail } from './emails/templates';
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
