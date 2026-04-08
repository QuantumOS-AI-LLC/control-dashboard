"use server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateJobStatus(jobId: string, newStatus: JobStatus) {
  try {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: newStatus },
    });
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update job status:", error);
    return { success: false, error: "Failed to update status" };
  }
}
