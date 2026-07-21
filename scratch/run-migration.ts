import { db } from '../db/index';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🚀 Running migration manually...');
  try {
    const statements = [
      `ALTER TABLE \`dwellings\` DROP INDEX \`unique_address_idx\``,
      `ALTER TABLE \`dwellings\` MODIFY COLUMN \`block_number\` varchar(20) NOT NULL`,
      `ALTER TABLE \`dwellings\` MODIFY COLUMN \`house_number\` varchar(20) NOT NULL`,
      `ALTER TABLE \`dwellings\` ADD CONSTRAINT \`unique_address_idx\` UNIQUE(\`block_number\`,\`house_number\`)`,
      `ALTER TABLE \`dwellings\` DROP COLUMN \`street_name\``,
      `ALTER TABLE \`users\` DROP COLUMN \`manual_address\``
    ];

    for (const stmt of statements) {
      console.log(`Executing: ${stmt}...`);
      try {
        await db.execute(sql.raw(stmt));
        console.log('Success!');
      } catch (err: any) {
        console.error('Error details:', err.originalError || err.cause || err);
      }
    }

    console.log('🎉 Manual migration finished!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();
