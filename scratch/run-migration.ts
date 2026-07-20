import { db } from '../db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('Running migrations via Drizzle db.execute...');
  try {
    await db.execute(sql`ALTER TABLE \`family_members\` ADD \`religion\` enum('Islam','Kristen','Katolik','Hindu','Buddha','Khonghucu','Lainnya')`);
    console.log('Success for family_members');
  } catch (err: any) {
    console.error('Error for family_members:', err.message);
  }

  try {
    await db.execute(sql`ALTER TABLE \`rental_residents\` ADD \`religion\` enum('Islam','Kristen','Katolik','Hindu','Buddha','Khonghucu','Lainnya')`);
    console.log('Success for rental_residents');
  } catch (err: any) {
    console.error('Error for rental_residents:', err.message);
  }
}

run().catch(console.error);
