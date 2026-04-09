import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data migration for JobStatus...");

  // Mapping old DB values to new human-readable values
  const mappings = {
    "SCHEDULED": "Scheduled",
    "IN_PROGRESS": "In Progress",
    "COMPLETED": "Completed",
    "INVOICED": "Invoiced",
    "PAID": "Paid",
    "CANCELLED": "Cancelled"
  };

  for (const [oldValue, newValue] of Object.entries(mappings)) {
    console.log(`Updating ${oldValue} -> ${newValue}...`);
    try {
      // Use executeRaw to bypass enum validation temporarily if needed
      await prisma.$executeRawUnsafe(
        `UPDATE "Job" SET "status" = $1::"JobStatus" WHERE "status"::text = $2`,
        newValue,
        oldValue
      );
    } catch (e) {
      console.error(`Failed to update ${oldValue}:`, e);
    }
  }

  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
