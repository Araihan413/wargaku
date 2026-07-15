import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { db } from '@/db';
import * as schema from '@/db/schema';

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
  emailAndPassword: {
    enabled: true,
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
      manualAddress: { type: 'string', required: false },
    },
  },
});
