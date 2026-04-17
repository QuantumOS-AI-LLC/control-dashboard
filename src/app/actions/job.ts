"use server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

import { triggerJobWebhook } from "@/lib/webhooks";

export async function updateJobStatus(jobId: string, newStatus: JobStatus) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: Administrative access required" };
    }

    // Guard: Prevent invoicing if timesheets are not approved
    if (newStatus === JobStatus.Invoiced) {
      const pendingTimesheets = await prisma.timesheet.count({
        where: {
          jobId,
          status: { in: ["PENDING", "REJECTED"] }
        }
      });

      if (pendingTimesheets > 0) {
        return {
          success: false,
          error: `Cannot invoice job: ${pendingTimesheets} timesheet(s) are still pending or rejected. Please resolve them first.`
        };
      }
    }

    const job = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: newStatus,
        // Lock all related timesheets if status is "Invoiced" or "Paid"
        timesheets: (newStatus === JobStatus.Invoiced || newStatus === JobStatus.Paid) ? {
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
      action_name: "job_status_updated",
      payload: {
        job_id: job.ghlJobId,
        portal_id: job.id,
        status: job.status,
        customer: job.customerName,
        foreman: job.assignedForeman?.name || job.foreman,
        crew: job.crew.map(u => u.name)
      }
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
      action_name: "job_assignment_updated",
      payload: {
        job_id: job.ghlJobId,
        portal_id: job.id,
        status: job.status,
        customer: job.customerName,
        foreman: job.assignedForeman?.name || "Unassigned",
        crew: job.crew.map(u => u.name)
      }
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
  customerEmail?: string;
  dispatchNotes?: string;
  scheduledDate?: Date;
  scheduledTime?: string;
  selectedContactId?: string;
  foremanId: string;
  crewIds?: string[];
}) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";
    
    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: High-level access required" };
    }

    let existingContact = null;

    // 1. Try to link an existing contact if explicitly provided
    if (data.selectedContactId) {
      existingContact = await prisma.contact.findUnique({
        where: { id: data.selectedContactId }
      });
    }

    // 2. Try deduplication based on phone or email
    if (!existingContact && (data.customerEmail || data.customerPhone)) {
      existingContact = await prisma.contact.findFirst({
        where: {
          OR: [
            data.customerEmail ? { email: data.customerEmail } : {},
            data.customerPhone ? { phone: data.customerPhone } : {}
          ]
        }
      });
    }

    let newlyCreatedContact = false;
    let contactIdToLink = existingContact?.id;

    // 3. Create new Contact if none exists
    if (!existingContact) {
      const newContactId = `MANUAL-${Date.now()}`;
      const newContact = await prisma.contact.create({
        data: {
          contactId: newContactId,
          fullName: data.customerName,
          firstName: data.customerName.split(' ')[0] || '',
          lastName: data.customerName.split(' ').slice(1).join(' ') || '',
          phone: data.customerPhone,
          email: data.customerEmail,
          leadSource: "Control Dashboard (Manual)"
          // Note: Address is isolated to Job, not saved on Contact here
        }
      });
      contactIdToLink = newContact.id;
      newlyCreatedContact = true;
    }
    // 4. Create the Job mapped to the Contact and Crew
    const job = await prisma.job.create({
      data: {
        customerName: data.customerName,
        address: data.address,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        dispatchNotes: data.dispatchNotes,
        scheduledDate: data.scheduledDate || new Date(),
        scheduledTime: data.scheduledTime || "08:00",
        status: JobStatus.Scheduled,
        title: `${data.customerName}'s Installation`,
        ghlJobId: `MANUAL-${Date.now()}`,
        // Connect the Job and Contact relation 
        contacts: contactIdToLink ? {
          connect: { id: contactIdToLink }
        } : undefined,
        // Connect Foreman and Crew
        assignedForeman: {
          connect: { id: data.foremanId }
        },
        crew: data.crewIds && data.crewIds.length > 0 ? {
          connect: data.crewIds.map(id => ({ id }))
        } : undefined
      },
      include: {
        contacts: true,
        assignedForeman: true,
        crew: true
      }
    });

    // 5. Trigger webhooks in the background (Non-blocking)
    (async () => {
      try {
        if (newlyCreatedContact) {
          const freshContact = await prisma.contact.findUnique({ where: { id: contactIdToLink } });
          if (freshContact) {
            await triggerJobWebhook({
              action_name: "contact_created",
              payload: {
                contact_id: freshContact.contactId,
                portal_id: freshContact.id,
                first_name: freshContact.firstName,
                last_name: freshContact.lastName,
                full_name: freshContact.fullName,
                email: freshContact.email,
                phone: freshContact.phone,
                source: freshContact.leadSource
              }
            });
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
        
        await triggerJobWebhook({
          action_name: "job_created",
          payload: {
            job_id: job.ghlJobId,
            portal_id: job.id,
            contact_id: job.contacts[0]?.contactId,
            status: job.status,
            customer: job.customerName,
            email: job.customerEmail,
            phone: job.customerPhone,
            address: job.address,
            scheduled_date: job.scheduledDate,
            scheduled_time: job.scheduledTime,
            foreman: job.assignedForeman?.name,
            crew: job.crew.map(u => u.name)
          }
        });
      } catch (err) {
        console.error("Failed executing background webhooks:", err);
      }
    })();

    revalidatePath("/admin/jobs");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/contacts");
    
    return { success: true, job };
  } catch (error) {
    console.error("Failed to create manual job:", error);
    return { success: false, error: "Failed to create installation record" };
  }
}

export async function getBookedSlotsForDate(dateStr: string) {
  try {
    const targetDate = new Date(dateStr);
    
    if (isNaN(targetDate.getTime())) {
      return { success: false, bookedSlots: [] };
    }

    const jobs = await prisma.job.findMany({
      where: {
        scheduledDate: targetDate,
        status: {
          not: JobStatus.Cancelled
        }
      },
      select: {
        scheduledTime: true
      }
    });

    return { 
      success: true, 
      bookedSlots: jobs.map(j => j.scheduledTime).filter(Boolean) as string[] 
    };
  } catch (error) {
    console.error("Failed to fetch booked slots:", error);
    return { success: false, bookedSlots: [] };
  }
}

export async function searchContactsByName(query: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, contacts: [] };
    }

    if (!query || query.length < 2) return { success: true, contacts: [] };

    const contacts = await prisma.contact.findMany({
      where: {
        fullName: {
          contains: query,
          mode: "insensitive"
        }
      },
      take: 5,
      select: {
        id: true,
        contactId: true,
        fullName: true,
        email: true,
        phone: true,
        address: true // used for autofilling address as requested
      }
    });

    return { success: true, contacts };
  } catch (error) {
    console.error("Error searching contacts:", error);
    return { success: false, contacts: [] };
  }
}

export async function getDispatchUsers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        employeeStatus: "ACTIVE",
        role: { in: ["FOREMAN", "MANAGER", "ADMIN", "CREW"] }
      },
      select: { id: true, name: true, role: true }
    });
    return { success: true, users };
  } catch (err) {
    console.error("Error fetching dispatch users:", err);
    return { success: false, users: [] };
  }
}
