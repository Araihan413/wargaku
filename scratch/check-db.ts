import { db } from "../db";
import * as schema from "../db/schema";

async function checkDb() {
  try {
    const roles = await db.select().from(schema.roles);
    const users = await db.select().from(schema.users);
    
    console.log("=== DATABASE CHECK ===");
    console.log(`Jumlah Role: ${roles.length}`);
    console.log(`Jumlah User: ${users.length}`);
    
    if (users.length > 0) {
      console.log("Daftar User:");
      users.forEach(u => {
        console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role ID: ${u.roleId}`);
      });
    } else {
      console.log("Tabel user kosong.");
    }
  } catch (error) {
    console.error("Gagal melakukan query database:", error);
  }
  process.exit();
}

checkDb();
