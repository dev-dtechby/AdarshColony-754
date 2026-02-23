import prisma from "../src/lib/prisma";

async function main() {
  console.log("🔄 Reset Members starting...");

  const dbName = await prisma.$queryRawUnsafe<any[]>(`SELECT DATABASE() as db;`);
  console.log("✅ Connected DB:", dbName?.[0]?.db);

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  // IMPORTANT: table names must match your Railway DB
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`ColonyMember\`;`);
  console.log("✅ Truncated: ColonyMember");

  // If this table exists in your schema, keep it; otherwise comment it
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`RegistrationSerial\`;`);
    console.log("✅ Truncated: RegistrationSerial");
  } catch {
    console.log("ℹ️ RegistrationSerial not found, skipped.");
  }

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);

  console.log("🎉 Members reset completed.");
}

main()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });