"use server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

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

export async function toggleJobDisabled(jobId: string, currentDisabled: boolean) {
  try {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { isDisabled: !currentDisabled },
    });

    revalidatePath("/admin/jobs");
    revalidatePath(`/admin/jobs/${jobId}`);
    revalidatePath("/admin/timesheets");
    return { success: true, isDisabled: job.isDisabled };
  } catch (error) {
    console.error("Failed to toggle job disabled status:", error);
    return { success: false, error: "Failed to toggle status" };
  }
}

export async function updateJobDispatchInfo(jobId: string, data: { customerPhone?: string; dispatchNotes?: string }) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
    
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: High-level access required" };
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        customerPhone: data.customerPhone,
        dispatchNotes: data.dispatchNotes
      }
    });

    revalidatePath(`/admin/jobs/${jobId}`);
    revalidatePath("/admin/jobs");
    revalidatePath("/employee/dashboard");
    return { success: true, job };
  } catch (error) {
    console.error("Failed to update job dispatch info:", error);
    return { success: false, error: "Failed to update details" };
  }
}

export async function createManualJob(data: {
  customerName: string;
  address: string;
  customerPhone?: string;
  dispatchNotes?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
}) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
    
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: High-level access required" };
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        customerName: data.customerName,
        address: data.address,
        customerPhone: data.customerPhone,
        dispatchNotes: data.dispatchNotes,
        scheduledDate: data.scheduledDate || new Date(),
        scheduledTime: data.scheduledTime || "08:00",
        status: JobStatus.Scheduled,
        title: `${data.customerName}'s Installation`,
        ghlJobId: `MANUAL-${Date.now()}`, // Temporary ID for manual jobs
      }
    });

    // Trigger webhook for new job
    await triggerJobWebhook({
      event: "job.created",
      job_id: job.ghlJobId,
      portal_id: job.id,
      status: job.status,
      customer: job.customerName,
      address: job.address,
      scheduled_date: job.scheduledDate,
      scheduled_time: job.scheduledTime
    });

    revalidatePath("/admin/jobs");
    revalidatePath("/admin/dashboard");
    
    return { success: true, job };
  } catch (error) {
    console.error("Failed to create manual job:", error);
    return { success: false, error: "Failed to create installation record" };
  }
}
