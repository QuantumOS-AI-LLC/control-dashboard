import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";
import { JobStatus } from "@prisma/client";

/**
 * Mapping GHL human-readable stages to internal Enum identifiers
 */
const GHL_JOB_STATUS_MAP: Record<string, JobStatus> = {
  "New_Lead": JobStatus.New_Lead,
  "New Lead": JobStatus.New_Lead,
  "Initial_Contact": JobStatus.Initial_Contact,
  "Initial Contact / Follow Up": JobStatus.Initial_Contact,
  "Estimate_Scheduled": JobStatus.Estimate_Scheduled,
  "Estimate Scheduled": JobStatus.Estimate_Scheduled,
  "Pending_Close": JobStatus.Pending_Close,
  "Pending Close / Decision": JobStatus.Pending_Close,
  "Booked_Pending_Docs": JobStatus.Booked_Pending_Docs,
  "Job Booked - Pending Docs": JobStatus.Booked_Pending_Docs,
  "Scheduled": JobStatus.Scheduled,
  "Ready for Schedule / Scheduled": JobStatus.Scheduled,
  "Digging_In_Progress": JobStatus.Digging_In_Progress,
  "Digging in Progress": JobStatus.Digging_In_Progress,
  "Digging_Completed": JobStatus.Digging_Completed,
  "Digging Completed": JobStatus.Digging_Completed,
  "In Progress": JobStatus.In_Progress,
  "Installation in Progress": JobStatus.In_Progress,
  "Completed": JobStatus.Completed,
  "Invoiced": JobStatus.Invoiced,
  "Paid": JobStatus.Paid,
  "Completed & Paid": JobStatus.Paid,
  "Cancelled": JobStatus.Cancelled,
  
  // lowercase keys
  "new_lead": JobStatus.New_Lead,
  "new lead": JobStatus.New_Lead,
  "initial_contact": JobStatus.Initial_Contact,
  "initial contact / follow up": JobStatus.Initial_Contact,
  "estimate_scheduled": JobStatus.Estimate_Scheduled,
  "estimate scheduled": JobStatus.Estimate_Scheduled,
  "pending_close": JobStatus.Pending_Close,
  "pending close / decision": JobStatus.Pending_Close,
  "booked_pending_docs": JobStatus.Booked_Pending_Docs,
  "job booked - pending docs": JobStatus.Booked_Pending_Docs,
  "scheduled": JobStatus.Scheduled,
  "ready for schedule / scheduled": JobStatus.Scheduled,
  "digging_in_progress": JobStatus.Digging_In_Progress,
  "digging in progress": JobStatus.Digging_In_Progress,
  "digging_completed": JobStatus.Digging_Completed,
  "digging completed": JobStatus.Digging_Completed,
  "in progress": JobStatus.In_Progress,
  "installation in progress": JobStatus.In_Progress,
  "completed": JobStatus.Completed,
  "invoiced": JobStatus.Invoiced,
  "paid": JobStatus.Paid,
  "completed & paid": JobStatus.Paid,
  "cancelled": JobStatus.Cancelled,
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

    //Helper functions for parsing to prevent NaN in DB
    const Float = (val: any) => (isNaN(parseFloat(val)) ? undefined : parseFloat(val));
    const Bool = (val: any) => {
      if (val === undefined || val === null) return undefined;
      return val === true || val === 'Yes' || val === 'true' || val === 'Checked';
    };

    // Map GHL Pipeline Stage to Portal Job Status
    let mappedStatus: any = undefined;
    if (body.pipeline_stage) {
      const stage = body.pipeline_stage.toLowerCase();
      if (stage.includes("new lead")) {
        mappedStatus = "New_Lead";
      } else if (stage.includes("initial contact") || stage.includes("follow up")) {
        mappedStatus = "Initial_Contact";
      } else if (stage.includes("estimate scheduled") || stage.includes("scheduled estimate")) {
        mappedStatus = "Estimate_Scheduled";
      } else if (stage.includes("close") || stage.includes("decision")) {
        mappedStatus = "Pending_Close";
      } else if (stage.includes("booked") || stage.includes("pending docs")) {
        mappedStatus = "Booked_Pending_Docs";
      } else if (stage.includes("ready for schedule") || (stage.includes("schedule") && !stage.includes("estimate"))) {
        mappedStatus = "Scheduled";
      } else if (stage.includes("digging in progress") || stage.includes("digging_in_progress")) {
        mappedStatus = "Digging_In_Progress";
      } else if (stage.includes("digging completed") || stage.includes("digging_completed")) {
        mappedStatus = "Digging_Completed";
      } else if (stage.includes("installation") || stage.includes("in progress") || stage.includes("in_progress")) {
        mappedStatus = "In_Progress";
      } else if (stage.includes("completed & paid") || stage.includes("completed and paid") || stage.includes("paid")) {
        mappedStatus = "Paid";
      }
    }

    // 1. Check for internal ID (2-way sync / callback logic)
    // If the portal_id or id is provided, we target that specific record.
    const targetId = body.id || body.portal_id;
    
    if (targetId) {
      // Find the job to ensure it's not a duplicate
      const job = await prisma.job.update({
        where: { id: targetId },
        data: {
          ghlJobId: body.job_id, // Link to real GHL ID
          customerName: body.customer_name,
          address: body.job_address,
          city: body.city,
          postalCode: body.postal_code,
          country: body.country,
          title: body.job_title,
          scheduledTime: body.job_time,
          customerPhone: body.phone,
          customerEmail: body.email,
          dispatchNotes: body.dispatch_notes,
          // Fencing additions
          fenceTypes: body.fence_types,
          installationType: body.installation_type,
          followUpDate: body.follow_up_date ? new Date(body.follow_up_date) : undefined,
          generalNotes: body.general_notes,
          priceRange: body.price_range,
          detailedJobDescription: body.detailed_job_description,
          othersInvolved: body.others_involved,
          preCloseStatus: body.pre_close_status,
          estimateLocation: body.estimate_location,
          frostHeight: body.frost_height,
          frostPrivacySlats: body.frost_privacy_slats !== undefined ? Bool(body.frost_privacy_slats) : undefined,
          frostColor: body.frost_color,
          exactPrice: body.exact_price !== undefined ? Float(body.exact_price) : undefined,
          depositValue: body.deposit_value !== undefined ? Float(body.deposit_value) : undefined,
          depositReceived: body.deposit_received !== undefined ? Bool(body.deposit_received) : undefined,
          timeline: body.timeline || body.target_timeline || body.production_timeline,
          ghlPipelineStage: body.pipeline_stage,
          accessLimitations: body.access_limitations,
          accessSkidExcavator: body.access_limitations !== undefined 
            ? (body.access_limitations === 'Skid access' || body.access_limitations === 'Excavator access')
            : (body.access_skid_excavator !== undefined ? Bool(body.access_skid_excavator) : undefined),
          bringBackDirt: body.bring_back_dirt !== undefined ? Bool(body.bring_back_dirt) : undefined,
          planFileUrl: body.plan_file_url,
          localisationCertificateUrl: body.localisation_certificate_url,
          hardDiggingHoles: body.hard_digging_holes !== undefined ? Number(body.hard_digging_holes) : undefined,
          diggingHours: body.digging_hours !== undefined ? Number(body.digging_hours) : undefined,
          diggingInvoiceUrl: body.digging_invoice_url,
          updatedAt: new Date(),
          ...(mappedStatus && { status: mappedStatus }),
        }
      });

      return NextResponse.json({
        success: true,
        message: "Job linked via 2-way sync",
        id: job.id,
        ghl_job_id: job.ghlJobId,
      });
    }

    if (!body.job_id) {
      return NextResponse.json({ error: "job_id or id is required" }, { status: 400 });
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
      country: body.country,
      title: body.job_title,
      scheduledTime: body.job_time,
      materialListUrl: body.material_list_url,
      scopeDocumentUrl: body.scope_document_url,
      customerPhone: body.phone,
      dispatchNotes: body.dispatch_notes,
      // Fencing additions
      fenceTypes: body.fence_types,
      installationType: body.installation_type,
      followUpDate: body.follow_up_date ? new Date(body.follow_up_date) : undefined,
      generalNotes: body.general_notes,
      priceRange: body.price_range,
      detailedJobDescription: body.detailed_job_description,
      othersInvolved: body.others_involved,
      preCloseStatus: body.pre_close_status,
      estimateLocation: body.estimate_location,
      frostHeight: body.frost_height,
      frostPrivacySlats: body.frost_privacy_slats !== undefined ? Bool(body.frost_privacy_slats) : undefined,
      frostColor: body.frost_color,
      exactPrice: Float(body.exact_price),
      depositValue: Float(body.deposit_value),
      depositReceived: body.deposit_received !== undefined ? Bool(body.deposit_received) : undefined,
      timeline: body.timeline || body.target_timeline || body.production_timeline,
      ghlPipelineStage: body.pipeline_stage,
      accessLimitations: body.access_limitations,
      accessSkidExcavator: body.access_limitations !== undefined 
        ? (body.access_limitations === 'Skid access' || body.access_limitations === 'Excavator access')
        : (body.access_skid_excavator !== undefined ? Bool(body.access_skid_excavator) : undefined),
      bringBackDirt: body.bring_back_dirt !== undefined ? Bool(body.bring_back_dirt) : undefined,
      planFileUrl: body.plan_file_url,
      localisationCertificateUrl: body.localisation_certificate_url,
      hardDiggingHoles: body.hard_digging_holes !== undefined ? Number(body.hard_digging_holes) : undefined,
      diggingHours: body.digging_hours !== undefined ? Number(body.digging_hours) : undefined,
      diggingInvoiceUrl: body.digging_invoice_url,
      ...(mappedStatus && { status: mappedStatus }),
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
        status: mappedStatus || JobStatus.New_Lead, // Default for new creations
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
