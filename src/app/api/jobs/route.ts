import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Mapping from n8n format to Prisma schema
    const job = await prisma.job.create({
      data: {
        ghlJobId: data.job_id,
        ghlContactId: data.contact_id,
        customerName: data.customer_name,
        assignedEmployee: data.assigned_employee,
        foreman: data.foreman,
        crewMembers: data.crew_members,
        address: data.job_address,
        city: data.city,
        postalCode: data.postal_code,
        scheduledDate: data.job_date ? new Date(data.job_date) : undefined,
        scheduledTime: data.job_time,
        status: "SCHEDULED", // Default
        materialListUrl: data.material_list_url,
        scopeDocumentUrl: data.scope_document_url,
        // Title for UI convenience
        title: data.customer_name ? `${data.customer_name}'s Installation` : "New Installation"
      }
    });

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    console.error("Job Webhook Error:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
