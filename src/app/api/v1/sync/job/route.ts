import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";
import { JobStatus } from "@prisma/client";

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

    // Map GHL fields to Prisma Job model (Matches n8n Step 19.3)
    const job = await prisma.job.upsert({
      where: { ghlJobId: body.job_id },
      update: {
        customerName: body.customer_name,
        assignedEmployee: body.assigned_employee,
        foreman: body.foreman,
        crewMembers: body.crew_members,
        address: body.job_address,
        city: body.city,
        postalCode: body.postal_code,
        scheduledDate: body.job_date ? new Date(body.job_date) : new Date(),
        scheduledTime: body.job_time,
        status: JobStatus.SCHEDULED,
        materialListUrl: body.material_list_url,
        scopeDocumentUrl: body.scope_document_url,
        updatedAt: new Date(),
      },
      create: {
        ghlJobId: body.job_id,
        ghlContactId: body.contact_id,
        customerName: body.customer_name,
        assignedEmployee: body.assigned_employee,
        foreman: body.foreman,
        crewMembers: body.crew_members,
        address: body.job_address,
        city: body.city,
        postalCode: body.postal_code,
        scheduledDate: body.job_date ? new Date(body.job_date) : new Date(),
        scheduledTime: body.job_time,
        status: JobStatus.SCHEDULED,
        materialListUrl: body.material_list_url,
        scopeDocumentUrl: body.scope_document_url,
        createdAt: new Date(),
        // Link to contact if it exists
        contacts: body.contact_id ? {
          connect: { contactId: body.contact_id }
        } : undefined
      },
    });

    // Handle n8n Step 19.6: Create Material List Entry
    await prisma.material.create({
      data: {
        jobId: job.id,
        status: "Pending",
        itemName: "Initial List - Check Document", // Placeholder
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Job assigned and material entry created",
      id: job.id,
    });
  } catch (error: any) {
    console.error("Error in job sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
