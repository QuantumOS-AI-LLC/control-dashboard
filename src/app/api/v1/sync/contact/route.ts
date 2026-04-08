import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";

/**
 * Endpoint for n8n Workflow 1: GHL to Sheets Contact Sync (Step 18)
 * Path: /api/v1/sync/contact
 */
export async function POST(req: Request) {
  try {
    const isValid = await validateApiRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Map GHL fields to Prisma Contact model (Matches n8n Step 18.3)
    const contact = await prisma.contact.upsert({
      where: { contactId: body.contact_id },
      update: {
        leadSource: body.lead_source,
        firstName: body.first_name,
        lastName: body.last_name,
        fullName: body.full_name || `${body.first_name} ${body.last_name}`,
        phone: body.phone,
        email: body.email,
        pipelineStage: body.pipeline_stage,
        opportunityId: body.opportunity_id,
        tags: Array.isArray(body.tags) ? body.tags.join(", ") : body.tags,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postal_code,
        updatedAt: new Date(),
      },
      create: {
        contactId: body.contact_id,
        leadSource: body.lead_source,
        firstName: body.first_name,
        lastName: body.last_name,
        fullName: body.full_name || `${body.first_name} ${body.last_name}`,
        phone: body.phone,
        email: body.email,
        pipelineStage: body.pipeline_stage,
        opportunityId: body.opportunity_id,
        tags: Array.isArray(body.tags) ? body.tags.join(", ") : body.tags,
        address: body.address,
        city: body.city,
        state: body.state,
        postalCode: body.postal_code,
        createdAt: body.created_at ? new Date(body.created_at) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contact synced to database",
      id: contact.id,
      contact_id: contact.contactId,
    });
  } catch (error: any) {
    console.error("Error in contact sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
