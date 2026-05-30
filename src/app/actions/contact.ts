"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { triggerJobWebhook } from "@/lib/webhooks";

export async function createManualContact(data: {
  fullName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  pipelineStage?: string;
  // Fencing specs & lead fields
  fenceTypes?: string[];
  roughJobDescription?: string;
  followUpDate?: Date | string;
  callNextYear?: boolean;
  generalNotes?: string;
}) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

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
        email: data.email || null,
        phone: data.phone,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        pipelineStage: data.pipelineStage || "New Lead",
        leadSource: "Manual Contact Entry"
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
          state: contact.state,
          postal_code: contact.postalCode,
          country: contact.country,
          source: "Manual Contact Entry",
          pipeline_stage: contact.pipelineStage
        }
      });
    } catch (webhookError) {
      console.error("Failed to trigger contact creation webhook:", webhookError);
    }

    // 4. Create associated Job (Opportunity) if lead/fencing specs are provided
    let job = null;
    const hasLeadSpecs = 
      (data.fenceTypes && data.fenceTypes.length > 0) || 
      data.roughJobDescription || 
      data.followUpDate || 
      data.callNextYear || 
      data.generalNotes;

    if (hasLeadSpecs) {
      const calculatedFollowUp = data.followUpDate 
        ? new Date(data.followUpDate) 
        : (data.callNextYear ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)) : null);

      job = await prisma.job.create({
        data: {
          ghlJobId: `MANUAL-OPP-${Date.now()}`,
          ghlContactId: contact.contactId,
          customerName: data.fullName,
          customerPhone: data.phone,
          customerEmail: data.email || null,
          title: `${data.fullName}'s Fencing Lead`,
          address: data.address || "TBD",
          status: "New_Lead", // Initial Lead Stage
          fenceTypes: data.fenceTypes || [],
          detailedJobDescription: data.roughJobDescription || null,
          generalNotes: data.generalNotes || null,
          followUpDate: calculatedFollowUp,
          timeline: data.callNextYear ? "Next year" : undefined,
          contacts: {
            connect: { id: contact.id }
          }
        }
      });

      // Trigger job_created webhook
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Delay to let contact sync first
        await triggerJobWebhook({
          action_name: "job_created",
          payload: {
            job_id: job.ghlJobId,
            portal_id: job.id,
            contact_id: contact.contactId,
            status: job.status,
            customer: job.customerName,
            email: job.customerEmail,
            phone: job.customerPhone,
            address: job.address,
            fence_types: job.fenceTypes,
            detailed_job_description: job.detailedJobDescription,
            general_notes: job.generalNotes,
            follow_up_date: job.followUpDate,
            timeline: job.timeline
          }
        });
      } catch (jobWebhookError) {
        console.error("Failed to trigger job creation webhook from contact intake:", jobWebhookError);
      }
    }

    revalidatePath("/admin/contacts");
    revalidatePath("/admin/jobs");
    revalidatePath("/admin/dashboard");
    
    return { success: true, contact, job };

  } catch (error: any) {
    console.error("Manual Contact Creation Error:", error);
    if (error.code === 'P2002') {
      return { success: false, error: "A contact with this identifier already exists." };
    }
    return { success: false, error: error.message || "Failed to create contact" };
  }
}
