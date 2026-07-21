import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('⚠️ Mengosongkan database lokal...');
  try {
    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);
    
    const tables = [
      'activity_logs',
      'complaints',
      'fee_payments',
      'fee_rules',
      'cash_transactions',
      'rental_residents',
      'rental_properties',
      'family_members',
      'families',
      'notifications',
      'sessions',
      'accounts',
      'users',
      'dwellings'
    ];

    for (const table of tables) {
      console.log(`Truncating table ${table}...`);
      try {
        await db.execute(sql.raw(`TRUNCATE TABLE \`${table}\``));
      } catch (err: any) {
        console.error(`Failed to truncate ${table}:`, err.message || err);
      }
    }

    await db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log('✅ Database berhasil dikosongkan!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal mengosongkan database:', error);
    process.exit(1);
  }
}

main();
