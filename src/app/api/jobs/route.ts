import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
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

    const hasJobDate = data.hasOwnProperty("job_date") || data.hasOwnProperty("jobDate") || data.hasOwnProperty("scheduledDate");
    const hasJobTime = data.hasOwnProperty("job_time") || data.hasOwnProperty("jobTime") || data.hasOwnProperty("scheduledTime");
    const hasJobDateTime = data.hasOwnProperty("job_date_time") || data.hasOwnProperty("jobDateTime") || data.hasOwnProperty("job_date_time_string");

    const incomingJobDate = data.job_date !== undefined ? data.job_date : (data.jobDate !== undefined ? data.jobDate : data.scheduledDate);
    const incomingJobTime = data.job_time !== undefined ? data.job_time : (data.jobTime !== undefined ? data.jobTime : data.scheduledTime);
    const incomingJobDateTime = data.job_date_time !== undefined 
      ? data.job_date_time 
      : (data.jobDateTime !== undefined ? data.jobDateTime : data.job_date_time_string);

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

    if (scheduledDateVal && isToday(scheduledDateVal) && isDefaultTime(scheduledTimeVal)) {
      scheduledDateVal = null;
      scheduledTimeVal = null;
    } else if (!scheduledDateVal && isDefaultTime(scheduledTimeVal)) {
      scheduledTimeVal = null;
    }

    // Sanitize estimate date/time fields
    let estimateDateVal: Date | null | undefined = undefined;
    let estimateTimeVal: string | null | undefined = undefined;

    const hasEstimateDate = data.hasOwnProperty("estimate_date") || data.hasOwnProperty("estimateDate");
    const hasEstimateTime = data.hasOwnProperty("estimate_time") || data.hasOwnProperty("estimateTime");
    const hasEstimateDateTime = data.hasOwnProperty("estimate_date_time") || data.hasOwnProperty("estimateDateTime") || data.hasOwnProperty("estimate_date_time_string");

    const incomingEstimateDate = data.estimate_date !== undefined ? data.estimate_date : data.estimateDate;
    const incomingEstimateTime = data.estimate_time !== undefined ? data.estimate_time : data.estimateTime;
    const incomingEstimateDateTime = data.estimate_date_time !== undefined 
      ? data.estimate_date_time 
      : (data.estimateDateTime !== undefined ? data.estimateDateTime : data.estimate_date_time_string);

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
        scheduledDate: scheduledDateVal,
        scheduledTime: scheduledTimeVal,
        estimateDate: estimateDateVal,
        estimateTime: estimateTimeVal,
        status: JobStatus.Scheduled, // Default
        ghlPipelineStage: "Ready for Schedule / Scheduled",
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
