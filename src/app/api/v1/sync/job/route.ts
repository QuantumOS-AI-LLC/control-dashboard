import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";
import { JobStatus } from "@prisma/client";

/**
 * Mapping GHL human-readable stages to internal Enum values
 */
const GHL_JOB_STATUS_MAP: Record<string, JobStatus> = {
  "Scheduled": JobStatus.SCHEDULED,
  "In Progress": JobStatus.IN_PROGRESS,
  "Completed": JobStatus.COMPLETED,
  "Invoiced": JobStatus.INVOICED,
  "Paid": JobStatus.PAID,
  "Cancelled": JobStatus.CANCELLED,
  "scheduled": JobStatus.SCHEDULED,
  "in progress": JobStatus.IN_PROGRESS,
  "completed": JobStatus.COMPLETED,
  "invoiced": JobStatus.INVOICED,
  "paid": JobStatus.PAID,
};

/**
 * Endpoint for n8n Workflow 2: Job Assignment Automation (Step 19)
 * Path: /api/v1/sync/job
 */
export async function POST(req: Request) {
  try {
    const isValid = await validateApiRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.job_id) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    // 1. Build the data object with only PROVIDED fields (Safe Partial Update)
    const data: any = {
      customerName: body.customer_name,
      assignedEmployee: body.assigned_employee,
      foreman: body.foreman,
      crewMembers: body.crew_members,
      address: body.job_address,
      city: body.city,
      postalCode: body.postal_code,
      scheduledTime: body.job_time,
      materialListUrl: body.material_list_url,
      scopeDocumentUrl: body.scope_document_url,
    };

    if (body.job_date) {
      data.scheduledDate = new Date(body.job_date);
    }

    // 2. Map Job Status from GHL
    if (body.job_status !== undefined) {
      const mappedStatus = GHL_JOB_STATUS_MAP[body.job_status as string];
      if (mappedStatus) {
        data.status = mappedStatus;
      } else {
        // If it looks like it might already be the enum value (all caps)
        if (Object.values(JobStatus).includes(body.job_status as any)) {
          data.status = body.job_status as JobStatus;
        }
      }
    }

    // Remove undefined fields
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    // 3. Perform Upsert
    const job = await prisma.job.upsert({
      where: { ghlJobId: body.job_id },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        ghlJobId: body.job_id,
        ghlContactId: body.contact_id,
        address: body.job_address || "TBD", // Ensure required field for creation
        status: JobStatus.SCHEDULED, // Default for new creations
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Link to contact if provided
        contacts: body.contact_id ? {
          connect: { contactId: body.contact_id }
        } : undefined
      },
    });

    // Handle n8n Step 19.6: Create Material List Entry (Only on initial creation)
    if (job.createdAt.getTime() === job.updatedAt.getTime()) {
      await prisma.material.create({
        data: {
          jobId: job.id,
          status: "Pending",
          itemName: "Initial List - Check Document",
          createdAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Job synced (Partial update supported)",
      id: job.id,
      status: job.status,
    });
  } catch (error: any) {
    console.error("Error in job sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
