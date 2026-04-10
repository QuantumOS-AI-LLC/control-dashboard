"use server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { triggerJobWebhook } from "@/lib/webhooks";

export async function updateJobStatus(jobId: string, newStatus: JobStatus) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: newStatus,
        // If status is "Invoiced", lock all related timesheets
        timesheets: newStatus === JobStatus.Invoiced ? {
          updateMany: {
            where: { isLocked: false },
            data: { isLocked: true }
          }
        } : undefined
      },
      include: {
        assignedForeman: true,
        crew: true
      }
    });

    // Trigger webhook for status change
    await triggerJobWebhook({
      event: "job.status_updated",
      job_id: job.ghlJobId,
      portal_id: job.id,
      status: job.status,
      customer: job.customerName,
      foreman: job.assignedForeman?.name || job.foreman,
      crew: job.crew.map(u => u.name)
    });

    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${jobId}`);
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to update job status:", error);
    return { success: false, error: "Failed to update status" };
  }
}

export async function assignJobTeam(jobId: string, foremanId: string, crewIds: string[]) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        assignedForemanId: foremanId || null,
        // Reset and re-assign many-to-many crew
        crew: {
          set: crewIds.map(id => ({ id }))
        }
      },
      include: {
        assignedForeman: true,
        crew: true
      }
    });

    // Trigger webhook for assignment change
    await triggerJobWebhook({
      event: "job.assignment_updated",
      job_id: job.ghlJobId,
      portal_id: job.id,
      status: job.status,
      customer: job.customerName,
      foreman: job.assignedForeman?.name || "Unassigned",
      crew: job.crew.map(u => u.name)
    });

    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${jobId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to assign team:", error);
    return { success: false, error: "Failed to assign team" };
  }
}
