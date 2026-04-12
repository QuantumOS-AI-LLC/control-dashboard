import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";
import { JobStatus } from "@prisma/client";

/**
 * Mapping GHL human-readable stages to internal Enum identifiers
 */
const GHL_JOB_STATUS_MAP: Record<string, JobStatus> = {
  "Scheduled": JobStatus.Scheduled,
  "In Progress": JobStatus.In_Progress,
  "Completed": JobStatus.Completed,
  "Invoiced": JobStatus.Invoiced,
  "Paid": JobStatus.Paid,
  "Cancelled": JobStatus.Cancelled,
  "scheduled": JobStatus.Scheduled,
  "in progress": JobStatus.In_Progress,
  "completed": JobStatus.Completed,
  "invoiced": JobStatus.Invoiced,
  "paid": JobStatus.Paid,
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
      title: body.job_title,
      scheduledTime: body.job_time,
      materialListUrl: body.material_list_url,
      scopeDocumentUrl: body.scope_document_url,
      customerPhone: body.phone,
      dispatchNotes: body.dispatch_notes,
    };

    // SMART RESOLUTION: Try to find Users by GHL Contact ID
    // This makes the "relation" real as requested by the user
    if (body.assigned_employee) {
      const worker = await prisma.user.findUnique({
        where: { ghlContactId: body.assigned_employee }
      });
      if (worker) {
        data.assignedEmployee = worker.name; // Display name
        // If the worker is a foreman, also auto-assign to foremanId
        if (worker.role === "FOREMAN" || worker.role === "MANAGER" || worker.role === "ADMIN") {
          data.assignedForemanId = worker.id;
        }
      }
    }

    if (body.foreman) {
      const foremanUser = await prisma.user.findUnique({
        where: { ghlContactId: body.foreman }
      });
      if (foremanUser) {
        data.foreman = foremanUser.name; // Display name
        data.assignedForemanId = foremanUser.id; // Link relation
      }
    }

    if (body.job_date) {
      data.scheduledDate = new Date(body.job_date);
    }

    // 2. Map Job Status from GHL
    if (body.job_status !== undefined) {
      const mappedStatus = GHL_JOB_STATUS_MAP[body.job_status as string];
      if (mappedStatus) {
        data.status = mappedStatus;
      } else {
        // Handle case-insensitive or direct match if possible
        const statusValue = body.job_status as string;
        const enumValues = Object.values(JobStatus);
        const match = enumValues.find(v => v.toLowerCase() === statusValue.toLowerCase());
        if (match) {
          data.status = match;
        }
      }
    }

    // Remove undefined fields
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    // 3. Perform Upsert
    // Ensure the Contact exists first to avoid relation errors
    if (body.contact_id) {
      await prisma.contact.upsert({
        where: { contactId: body.contact_id },
        update: {},
        create: {
          contactId: body.contact_id,
          fullName: body.customer_name || "Unknown Customer",
          email: body.email, // If available
          phone: body.phone, // If available
        }
      });
    }

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
        status: JobStatus.Scheduled, // Default for new creations
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

// Support both POST (Upsert) and PATCH (Explicit Update)
export const PATCH = POST;
