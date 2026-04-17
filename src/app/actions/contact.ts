"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { triggerJobWebhook } from "@/lib/webhooks";

export async function createManualContact(data: {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  pipelineStage?: string;
}) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN";

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: Administrative access required" };
    }

    // 1. Generate a manual GHL ID for internal tracking
    const manualId = `MANUAL-${Date.now()}`;

    // 2. Create the contact in DB
    const contact = await prisma.contact.create({
      data: {
        contactId: manualId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        pipelineStage: data.pipelineStage || "New Lead",
        leadSource: "Manual Portal Entry"
      }
    });

    // 3. Trigger webhook for GHL sync (n8n should pick this up)
    try {
      await triggerJobWebhook({
        action_name: "contact_created",
        payload: {
          contact_id: contact.contactId,
          portal_id: contact.id,
          full_name: contact.fullName,
          first_name: data.fullName.split(' ')[0],
          last_name: data.fullName.split(' ').slice(1).join(' '),
          email: contact.email,
          phone: contact.phone,
          address: contact.address,
          city: contact.city,
          source: "Manual Portal Entry",
          pipeline_stage: contact.pipelineStage
        }
      });
    } catch (webhookError) {
      console.error("Failed to trigger contact creation webhook:", webhookError);
      // We don't fail the contact creation if the webhook fails, but we log it
    }

    revalidatePath("/admin/contacts");
    return { success: true, contact };

  } catch (error: any) {
    console.error("Manual Contact Creation Error:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A contact with this identifier already exists." };
    }
    return { success: false, error: error.message || "Failed to create contact" };
  }
}
