import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting final database status fix...");

  const mapping = {
    'SCHEDULED': 'Scheduled',
    'IN_PROGRESS': 'In_Progress', // Identifier is In_Progress
    'COMPLETED': 'Completed',
    'INVOICED': 'Invoiced',
    'PAID': 'Paid',
    'CANCELLED': 'Cancelled'
  };

  for (const [oldVal, newVal] of Object.entries(mapping)) {
    console.log(`Mapping ${oldVal} to ${newVal}...`);
    try {
      // We cast the old status to text to compare, and cast the new value to the JobStatus enum type
      await prisma.$executeRawUnsafe(
        `UPDATE "Job" SET "status" = $1::"JobStatus" WHERE "status"::text = $2`,
        newVal,
        oldVal
      );
    } catch (e) {
      console.error(`Failed to map ${oldVal}:`, e);
    }
  }

  console.log("Database fix complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
