import { db } from '../db';
import { sql } from 'drizzle-orm';

async function main() {
  console.log("🧹 Dropping foreign key constraint & old deprecated tables 'family_members' and 'rental_residents'...");
  try {
    await db.execute(sql`ALTER TABLE \`letters\` DROP FOREIGN KEY \`letters_family_member_id_family_members_id_fk\``);
  } catch (e) {
    console.log("FK constraint already dropped or not present.");
  }
  await db.execute(sql`DROP TABLE IF EXISTS \`family_members\``);
  await db.execute(sql`DROP TABLE IF EXISTS \`rental_residents\``);
  console.log("✅ Successfully dropped old tables!");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error dropping old tables:", err);
  process.exit(1);
});
