import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`SELECT COUNT(*) as count FROM dwellings`);
  console.log('dwellings count:', result);
  const result2 = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
  console.log('users count:', result2);
  const details = await db.execute(sql`SELECT * FROM dwellings`);
  console.log('dwellings rows:', details);
  process.exit(0);
}

main();
