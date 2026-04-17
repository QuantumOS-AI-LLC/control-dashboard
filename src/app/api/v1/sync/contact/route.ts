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

    // 1. Check for internal ID (2-way sync / callback logic)
    // If the portal_id or id is provided, we target that specific record.
    const targetId = body.id || body.portal_id;
    
    if (targetId) {
      const contact = await prisma.contact.update({
        where: { id: targetId },
        data: {
          contactId: body.contact_id, // Link to real GHL ID
          leadSource: body.lead_source,
          firstName: body.first_name,
          lastName: body.last_name,
          fullName: body.full_name || `${body.first_name || ""} ${body.last_name || ""}`.trim(),
          phone: body.phone,
          email: body.email,
          pipelineStage: body.pipeline_stage,
          address: body.address,
          city: body.city,
          state: body.state,
          postalCode: body.postal_code,
          country: body.country,
          updatedAt: new Date(),
        }
      });

      return NextResponse.json({
        success: true,
        message: "Contact linked via 2-way sync",
        id: contact.id,
        contact_id: contact.contactId,
      });
    }

    if (!body.contact_id) {
      return NextResponse.json({ error: "contact_id or id is required" }, { status: 400 });
    }

    // 1. Build the data object with only PROVIDED fields (Safe Partial Update)
    // This prevents overwriting existing data with "undefined" or empty values.
    const data: any = {
      leadSource: body.lead_source,
      firstName: body.first_name,
      lastName: body.last_name,
      phone: body.phone,
      email: body.email,
      pipelineStage: body.pipeline_stage,
      opportunityId: body.opportunity_id,
      address: body.address,
      city: body.city,
      state: body.state,
      postalCode: body.postal_code,
      country: body.country,
    };

    // Handle tags (string array to comma-separated string)
    if (body.tags !== undefined) {
      data.tags = Array.isArray(body.tags) ? body.tags.join(", ") : body.tags;
    }

    // Handle full name logic specifically
    if (body.full_name) {
      data.fullName = body.full_name;
    } else if (body.first_name !== undefined || body.last_name !== undefined) {
      // Only recalculate fullName if at least one name part is provided
      data.fullName = `${body.first_name || ""} ${body.last_name || ""}`.trim();
    }

    // Remove undefined fields to prevent Prisma from touching them
    Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

    // 2. Perform Upsert
    const contact = await prisma.contact.upsert({
      where: { contactId: body.contact_id },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        contactId: body.contact_id,
        ...data,
        createdAt: body.created_at ? new Date(body.created_at) : new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Contact synced (Partial update supported)",
      id: contact.id,
      contact_id: contact.contactId,
    });
  } catch (error: any) {
    console.error("Error in contact sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support both POST (Upsert) and PATCH (Explicit Update)
export const PATCH = POST;
