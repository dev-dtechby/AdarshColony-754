import prisma from "../src/lib/prisma";

async function main() {
  console.log("🔄 Reset DB (truncate all tables) starting...");

  const dbName = await prisma.$queryRawUnsafe<any[]>(`SELECT DATABASE() as db;`);
  console.log("✅ Connected DB:", dbName?.[0]?.db);

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  // ✅ IMPORTANT: alias TABLE_NAME as table_name so JS key is stable
  const tables = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(`
    SELECT TABLE_NAME AS table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND TABLE_TYPE = 'BASE TABLE';
  `);

  for (const t of tables) {
    const name = t?.table_name;

    // safety
    if (!name) continue;
    if (name === "_prisma_migrations") continue;

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${name}\`;`);
    console.log("✅ Truncated:", name);
  }

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log("🎉 DB reset completed.");
}

main()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });