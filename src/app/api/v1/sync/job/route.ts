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

    let body = await req.json();

    // Recursive helper to sanitize "[undefined]" and "undefined" literal strings to null
    const sanitizeObject = (obj: any): any => {
      if (obj === null || obj === undefined) return null;
      if (typeof obj === 'string') {
        const clean = obj.trim().toLowerCase();
        if (clean === '[undefined]' || clean === 'undefined') {
          return null;
        }
        return obj;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = sanitizeObject(value);
        }
        return cleaned;
      }
      return obj;
    };

    body = sanitizeObject(body);

    // Helper functions for parsing
    const Float = (val: any) => {
      if (val === null || val === undefined) return null;
      const parsed = parseFloat(val);
      return isNaN(parsed) ? null : parsed;
    };
    const Bool = (val: any) => {
      if (val === undefined || val === null) return null;
      return val === true || val === 'Yes' || val === 'true' || val === 'Checked';
    };
    const Num = (val: any) => {
      if (val === null || val === undefined) return null;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? null : parsed;
    };

    // 1. Sanitize default values from GHL/API callings if they are provided
    let installationTypeVal: string | null | undefined = undefined;
    if (body.hasOwnProperty("installation_type") || body.hasOwnProperty("installationType")) {
      const incomingVal = body.installation_type !== undefined ? body.installation_type : body.installationType;
      if (incomingVal) {
        const lowerType = incomingVal.toLowerCase().trim();
        if (lowerType === "in ground (standard)" || lowerType === "in ground" || lowerType === "") {
          installationTypeVal = null;
        } else {
          installationTypeVal = incomingVal;
        }
      } else {
        installationTypeVal = null;
      }
    }

    // Helper function to parse GHL date-time strings
    const parseGhlDateTime = (val: string | null | undefined) => {
      if (!val) return { date: null, time: null };
      const trimmed = val.trim();
      if (trimmed === "" || trimmed.toLowerCase() === "[undefined]" || trimmed.toLowerCase() === "undefined") {
        return { date: null, time: null };
      }
      
      const parsedDate = new Date(trimmed);
      if (isNaN(parsedDate.getTime())) {
        return { date: null, time: null };
      }
      
      // Extract time part from string if possible (e.g., "7:00 PM")
      const timeMatch = trimmed.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/);
      const timeStr = timeMatch ? timeMatch[1] : null;
      
      let timeVal = timeStr;
      if (!timeVal) {
        let hours = parsedDate.getHours();
        const minutes = parsedDate.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        timeVal = `${hours}:${minutes} ${ampm}`;
      }

      const dateOnly = new Date(parsedDate);
      dateOnly.setHours(0, 0, 0, 0);

      return { date: dateOnly, time: timeVal };
    };

    const hasTimeComponent = (val: string) => {
      return /(\d{1,2}:\d{2})/.test(val);
    };

    let scheduledDateVal: Date | null | undefined = undefined;
    let scheduledTimeVal: string | null | undefined = undefined;

    const hasJobDate = body.hasOwnProperty("job_date") || body.hasOwnProperty("jobDate") || body.hasOwnProperty("scheduledDate");
    const hasJobTime = body.hasOwnProperty("job_time") || body.hasOwnProperty("jobTime") || body.hasOwnProperty("scheduledTime");
    const hasJobDateTime = body.hasOwnProperty("job_date_time") || body.hasOwnProperty("jobDateTime") || body.hasOwnProperty("job_date_time_string");

    const incomingJobDate = body.job_date !== undefined ? body.job_date : (body.jobDate !== undefined ? body.jobDate : body.scheduledDate);
    const incomingJobTime = body.job_time !== undefined ? body.job_time : (body.jobTime !== undefined ? body.jobTime : body.scheduledTime);
    const incomingJobDateTime = body.job_date_time !== undefined 
      ? body.job_date_time 
      : (body.jobDateTime !== undefined ? body.jobDateTime : body.job_date_time_string);

    if (hasJobDateTime && incomingJobDateTime) {
      const { date, time } = parseGhlDateTime(incomingJobDateTime);
      scheduledDateVal = date;
      scheduledTimeVal = time;
    } else if (hasJobDate && incomingJobDate) {
      if (hasTimeComponent(incomingJobDate)) {
        const { date, time } = parseGhlDateTime(incomingJobDate);
        scheduledDateVal = date;
        scheduledTimeVal = time;
      } else {
        const parsedDate = new Date(incomingJobDate);
        if (!isNaN(parsedDate.getTime())) {
          const dateOnly = new Date(parsedDate);
          dateOnly.setHours(0, 0, 0, 0);
          scheduledDateVal = dateOnly;
        } else {
          scheduledDateVal = null;
        }
      }
    } else {
      if (hasJobDate) {
        scheduledDateVal = null;
      }
    }

    if (hasJobTime && !scheduledTimeVal) {
      scheduledTimeVal = incomingJobTime || null;
    }

    // Sanitize estimate date/time fields
    let estimateDateVal: Date | null | undefined = undefined;
    let estimateTimeVal: string | null | undefined = undefined;

    const hasEstimateDate = body.hasOwnProperty("estimate_date") || body.hasOwnProperty("estimateDate");
    const hasEstimateTime = body.hasOwnProperty("estimate_time") || body.hasOwnProperty("estimateTime");
    const hasEstimateDateTime = body.hasOwnProperty("estimate_date_time") || body.hasOwnProperty("estimateDateTime") || body.hasOwnProperty("estimate_date_time_string");

    const incomingEstimateDate = body.estimate_date !== undefined ? body.estimate_date : body.estimateDate;
    const incomingEstimateTime = body.estimate_time !== undefined ? body.estimate_time : body.estimateTime;
    const incomingEstimateDateTime = body.estimate_date_time !== undefined 
      ? body.estimate_date_time 
      : (body.estimateDateTime !== undefined ? body.estimateDateTime : body.estimate_date_time_string);

    if (hasEstimateDateTime && incomingEstimateDateTime) {
      const { date, time } = parseGhlDateTime(incomingEstimateDateTime);
      estimateDateVal = date;
      estimateTimeVal = time;
    } else {
      if (hasEstimateDate) {
        if (incomingEstimateDate) {
          const parsed = new Date(incomingEstimateDate);
          if (!isNaN(parsed.getTime())) {
            const dateOnly = new Date(parsed);
            dateOnly.setHours(0, 0, 0, 0);
            estimateDateVal = dateOnly;
          } else {
            estimateDateVal = null;
          }
        } else {
          estimateDateVal = null;
        }
      }
      if (hasEstimateTime) {
        estimateTimeVal = incomingEstimateTime || null;
      }
    }

    const isToday = (date: Date) => {
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    const isDefaultTime = (time: string | null | undefined) => {
      if (!time) return true;
      const cleanTime = time.trim().toLowerCase();
      return cleanTime === "08:00 am" || cleanTime === "08:00" || cleanTime === "8:00 am" || cleanTime === "08:00:00" || cleanTime === "8:00" || cleanTime === "";
    };

    // If both are provided and they represent the default today + 08:00 AM, clear both
    if (scheduledDateVal && isToday(scheduledDateVal) && isDefaultTime(scheduledTimeVal)) {
      scheduledDateVal = null;
      scheduledTimeVal = null;
    } else if (!scheduledDateVal && isDefaultTime(scheduledTimeVal)) {
      scheduledTimeVal = null;
    }

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

    const buildUpdateData = (source: any) => {
      const data: any = {};
      
      const setIfPresent = (key: string, sourceKey: string, transform?: (val: any) => any) => {
        if (source.hasOwnProperty(sourceKey)) {
          const val = source[sourceKey];
          data[key] = transform ? transform(val) : (val === undefined ? null : val);
        }
      };

      setIfPresent("ghlJobId", "job_id");
      setIfPresent("ghlContactId", "contact_id");
      setIfPresent("customerName", "customer_name");
      setIfPresent("address", "job_address");
      setIfPresent("city", "city");
      setIfPresent("postalCode", "postal_code");
      setIfPresent("country", "country");
      setIfPresent("title", "job_title");
      setIfPresent("customerPhone", "phone");
      setIfPresent("customerEmail", "email");
      setIfPresent("dispatchNotes", "dispatch_notes");
      setIfPresent("fenceTypes", "fence_types");
      setIfPresent("generalNotes", "general_notes");
      setIfPresent("priceRange", "price_range");
      setIfPresent("detailedJobDescription", "detailed_job_description");
      setIfPresent("othersInvolved", "others_involved");
      setIfPresent("preCloseStatus", "pre_close_status");
      setIfPresent("estimateLocation", "estimate_location");
      setIfPresent("frostHeight", "frost_height");
      setIfPresent("frostColor", "frost_color");
      setIfPresent("planFileUrl", "plan_file_url");
      setIfPresent("localisationCertificateUrl", "localisation_certificate_url");
      setIfPresent("diggingInvoiceUrl", "digging_invoice_url");

      if (source.hasOwnProperty("follow_up_date")) {
        const val = source.follow_up_date;
        data.followUpDate = (val && !isNaN(new Date(val).getTime())) ? new Date(val) : null;
      }

      if (source.hasOwnProperty("frost_privacy_slats")) {
        data.frostPrivacySlats = Bool(source.frost_privacy_slats);
      }
      if (source.hasOwnProperty("exact_price")) {
        data.exactPrice = Float(source.exact_price);
      }
      if (source.hasOwnProperty("deposit_value")) {
        data.depositValue = Float(source.deposit_value);
      }
      if (source.hasOwnProperty("deposit_received")) {
        data.depositReceived = Bool(source.deposit_received);
      }
      
      if (source.hasOwnProperty("timeline") || source.hasOwnProperty("target_timeline") || source.hasOwnProperty("production_timeline")) {
        data.timeline = source.timeline || source.target_timeline || source.production_timeline || null;
      }
      
      if (source.hasOwnProperty("hard_digging_holes")) {
        data.hardDiggingHoles = Num(source.hard_digging_holes);
      }
      if (source.hasOwnProperty("digging_hours")) {
        data.diggingHours = Float(source.digging_hours);
      }

      if (scheduledDateVal !== undefined) {
        data.scheduledDate = scheduledDateVal;
      }
      if (scheduledTimeVal !== undefined) {
        data.scheduledTime = scheduledTimeVal;
      }
      if (installationTypeVal !== undefined) {
        data.installationType = installationTypeVal;
      }

      if (estimateDateVal !== undefined) {
        data.estimateDate = estimateDateVal;
      }
      if (estimateTimeVal !== undefined) {
        data.estimateTime = estimateTimeVal;
      }
      if (source.hasOwnProperty("estimate_completed")) {
        const completed = Bool(source.estimate_completed);
        data.estimateCompleted = completed;
        if (completed) {
          data.estimateCompletionDate = new Date();
        } else {
          data.estimateCompletionDate = null;
        }
      }
      setIfPresent("estimateCompletionNotes", "estimate_completion_notes");

      if (source.hasOwnProperty("access_limitations")) {
        data.accessLimitations = source.access_limitations || null;
        if (source.access_limitations === 'Skid access' || source.access_limitations === 'Excavator access') {
          data.accessSkidExcavator = true;
        } else if (source.access_limitations === null) {
          data.accessSkidExcavator = null;
        }
      }
      if (source.hasOwnProperty("access_skid_excavator") && !data.hasOwnProperty("accessSkidExcavator")) {
        data.accessSkidExcavator = Bool(source.access_skid_excavator);
      }
      if (source.hasOwnProperty("bring_back_dirt")) {
        data.bringBackDirt = Bool(source.bring_back_dirt);
      }

      return data;
    };

    const updateData = buildUpdateData(body);
    if (mappedStatus) {
      updateData.status = mappedStatus;
    }

    // 1. Check for internal ID (2-way sync / callback logic)
    // If the portal_id or id is provided, we target that specific record.
    const targetId = body.id || body.portal_id;

    // Fetch existing job to detect which fields get updated
    const existingJob = await prisma.job.findFirst({
      where: targetId 
        ? { id: targetId } 
        : (body.job_id ? { ghlJobId: body.job_id } : { id: "never-match-dummy-id" })
    });

    if (targetId) {
      // Find the job to ensure it's not a duplicate
      const job = await prisma.job.update({
        where: { id: targetId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        }
      });

      const updatedFields: string[] = [];
      if (existingJob) {
        for (const key of Object.keys(job)) {
          if (key === 'updatedAt' || key === 'createdAt') continue;
          const oldVal = (existingJob as any)[key];
          const newVal = (job as any)[key];
          if (oldVal instanceof Date && newVal instanceof Date) {
            if (oldVal.getTime() !== newVal.getTime()) updatedFields.push(key);
          } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) updatedFields.push(key);
          } else if (oldVal !== newVal) {
            updatedFields.push(key);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: "Job linked via 2-way sync",
        id: job.id,
        ghl_job_id: job.ghlJobId,
        updatedFields
      });
    }

    if (!body.job_id) {
      return NextResponse.json({ error: "job_id or id is required" }, { status: 400 });
    }

    // SMART RESOLUTION: Try to find Users by GHL Contact ID
    // This makes the "relation" real as requested by the user
    if (body.assigned_employee) {
      const worker = await prisma.user.findUnique({
        where: { ghlContactId: body.assigned_employee }
      });
      if (worker) {
        updateData.assignedEmployee = worker.name; // Display name
        // If the worker is a foreman, also auto-assign to foremanId
        if (worker.role === "FOREMAN" || worker.role === "MANAGER" || worker.role === "ADMIN") {
          updateData.assignedForemanId = worker.id;
        }
      }
    }

    if (body.foreman) {
      const foremanUser = await prisma.user.findUnique({
        where: { ghlContactId: body.foreman }
      });
      if (foremanUser) {
        updateData.foreman = foremanUser.name; // Display name
        updateData.assignedForemanId = foremanUser.id; // Link relation
      }
    }

    // 2. Map Job Status from GHL
    if (body.job_status !== undefined) {
      const mappedStatusVal = GHL_JOB_STATUS_MAP[body.job_status as string];
      if (mappedStatusVal) {
        updateData.status = mappedStatusVal;
      } else {
        // Handle case-insensitive or direct match if possible
        const statusValue = body.job_status as string;
        const enumValues = Object.values(JobStatus);
        const match = enumValues.find(v => v.toLowerCase() === statusValue.toLowerCase());
        if (match) {
          updateData.status = match;
        }
      }
    }

    // Ensure ghlPipelineStage aligns with the status if status was updated
    if (updateData.status) {
      const mapStatusToStage = (status: JobStatus): string => {
        switch (status) {
          case JobStatus.New_Lead: return "New Lead";
          case JobStatus.Initial_Contact: return "Initial Contact / Follow Up";
          case JobStatus.Estimate_Scheduled: return "Estimate Scheduled";
          case JobStatus.Pending_Close: return "Pending Close / Decision";
          case JobStatus.Booked_Pending_Docs: return "Job Booked - Pending Docs";
          case JobStatus.Scheduled: return "Ready for Schedule / Scheduled";
          case JobStatus.Digging_In_Progress: return "Digging in Progress";
          case JobStatus.Digging_Completed: return "Digging Completed";
          case JobStatus.In_Progress: return "Installation in Progress";
          case JobStatus.Completed: return "Completed & Paid";
          case JobStatus.Invoiced: return "Completed & Paid";
          case JobStatus.Paid: return "Completed & Paid";
          default: return "";
        }
      };
      updateData.ghlPipelineStage = mapStatusToStage(updateData.status);
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    // 3. Perform Upsert
    // Ensure the Contact exists first to avoid relation errors
    if (body.contact_id) {
      await prisma.contact.upsert({
        where: { contactId: body.contact_id },
        update: {},
        create: {
          contactId: body.contact_id,
          fullName: body.customer_name || "Unknown Customer",
          email: body.email || null,
          phone: body.phone || null,
        }
      });
    }

    const job = await prisma.job.upsert({
      where: { ghlJobId: body.job_id },
      update: {
        ...updateData,
        updatedAt: new Date(),
      },
      create: {
        ghlJobId: body.job_id,
        ghlContactId: body.contact_id || null,
        address: body.job_address || null, // Optional in DB schema now
        status: mappedStatus || JobStatus.New_Lead, // Default for new creations
        ...updateData,
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

    const updatedFields: string[] = [];
    if (existingJob) {
      for (const key of Object.keys(job)) {
        if (key === 'updatedAt' || key === 'createdAt') continue;
        const oldVal = (existingJob as any)[key];
        const newVal = (job as any)[key];
        if (oldVal instanceof Date && newVal instanceof Date) {
          if (oldVal.getTime() !== newVal.getTime()) updatedFields.push(key);
        } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) updatedFields.push(key);
        } else if (oldVal !== newVal) {
          updatedFields.push(key);
        }
      }
    } else {
      // For newly created job, return all non-null fields
      for (const [key, val] of Object.entries(job)) {
        if (val !== null && val !== undefined && key !== 'updatedAt' && key !== 'createdAt') {
          updatedFields.push(key);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: existingJob ? "Job synced (Partial update supported)" : "Job created",
      id: job.id,
      status: job.status,
      updatedFields
    });
  } catch (error: any) {
    console.error("Error in job sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Support both POST (Upsert) and PATCH (Explicit Update)
export const PATCH = POST;
