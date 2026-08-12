import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  plugins: [
    inferAdditionalFields({
      user: {
        roleId: { type: 'number', required: false },
        phone: { type: 'string', required: false },
        photo: { type: 'string', required: false },
        status: { type: 'string', required: true },
        nik: { type: 'string', required: false },
        familyNumber: { type: 'string', required: false },
        dwellingId: { type: 'number', required: false },
      },
    }),
  ],
});


