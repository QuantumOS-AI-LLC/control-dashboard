import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { JobStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { 
      jobId, 
      startTime, 
      endTime, 
      tasksCompleted, 
      materialsUsed, 
      date, 
      isCompleted, 
      // Completion fields
      completionNotes, 
      completionImages,
      completionDate,
      finalMaterialsUsed,
      issuesEncountered,
      customerSatisfactionScore,
      // Digging fields
      isDiggingComplete,
      diggingHours,
      hardDiggingHoles,
      diggingPhotos
    } = data;

    // Check if job exists and if it's disabled
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.isDisabled) {
      return NextResponse.json({ error: "This job is finalized and no longer accepting entries." }, { status: 400 });
    }

    // Normalize incoming date to UTC 00:00:00.000 for strict daily matching
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    let totalHours = 0;
    if (isDiggingComplete) {
      totalHours = Number(diggingHours) || 0;
    } else {
      totalHours = calculateHours(startTime, endTime);
    }

    let timesheet = null;

    // 1. Create Timesheet (only if hours were actually logged)
    if (totalHours > 0) {
      timesheet = await prisma.timesheet.create({
        data: {
          employeeId: session.user.id,
          jobId,
          date: normalizedDate,
          startTime: isDiggingComplete ? (startTime || "07:00") : startTime,
          endTime: isDiggingComplete ? (endTime || "15:00") : endTime,
          totalHours: totalHours,
          tasksCompleted: isDiggingComplete ? "DIGGING COMPLETED REPORT" : tasksCompleted,
          materialsUsed: materialsUsed || "",
        },
        include: {
          employee: { select: { name: true } },
          job: { select: { title: true, id: true, isDisabled: true, ghlJobId: true, customerName: true } }
        }
      });
    }

    // 2. Handle Job Completion if toggled
    if (isCompleted) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.Completed,
          isDisabled: true, // Automatically disable upon completion
          completionNotes: completionNotes || "",
          completionImages,
          completionDate: completionDate ? new Date(completionDate) : new Date(),
          finalMaterialsUsed: finalMaterialsUsed || "",
          issuesEncountered: issuesEncountered || "",
          customerSatisfactionScore: customerSatisfactionScore || 5,
        }
      });
    } else if (isDiggingComplete) {
      // 3. Handle Digging Completion if toggled
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: JobStatus.Digging_Completed,
          diggingHours: Number(diggingHours) || 0,
          hardDiggingHoles: Number(hardDiggingHoles) || 0,
          diggingPhotos: diggingPhotos || []
        }
      });
    }

    // 4. Post to Webhook (Non-blocking)
    const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
    if (webhookUrl) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
      
      const fireWebhook = async (actionName: string, payload: any) => {
        try {
          await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action_name: actionName,
              payload: {
                ...payload,
                timestamp: new Date().toISOString()
              }
            })
          });
        } catch (err: any) {
          console.error(`Webhook fail for ${actionName}:`, err.message);
        }
      };

      if (isDiggingComplete) {
        // Trigger digging actions sequential webhooks
        await fireWebhook("job_digging_metrics_updated", {
          portal_id: jobId,
          job_id: job.ghlJobId,
          hard_digging_holes: Number(hardDiggingHoles) || 0,
          digging_hours: Number(diggingHours) || 0,
        });

        if (diggingPhotos && diggingPhotos.length > 0) {
          await fireWebhook("job_digging_photos_added", {
            portal_id: jobId,
            job_id: job.ghlJobId,
            photos: diggingPhotos,
            total_photos: diggingPhotos.length,
          });
        }

        await fireWebhook("job_status_updated", {
          job_id: job.ghlJobId,
          portal_id: jobId,
          status: JobStatus.Digging_Completed,
          ghl_pipeline_stage: "Digging Completed",
          customer: job.customerName,
        });
      } else {
        await fireWebhook(isCompleted ? "job_completion" : "timesheet_submit", {
          timesheetId: timesheet?.id || null,
          employeeName: timesheet?.employee?.name || user?.name || "Unknown",
          jobTitle: timesheet?.job?.title || job.title,
          jobId: jobId,
          date: timesheet?.date || normalizedDate,
          totalHours: totalHours,
          tasksCompleted: tasksCompleted,
          materialsUsed: materialsUsed,
          isCompleted,
          completionDate: isCompleted ? completionDate : null,
          customerSatisfactionScore: isCompleted ? customerSatisfactionScore : null,
        });
      }
    }

    return NextResponse.json({ success: true, timesheet }, { status: 201 });
  } catch (error) {
    console.error("Timesheet API Error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}

function calculateHours(start: string, end: string) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const diffInMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  return parseFloat((diffInMinutes / 60).toFixed(2));
}
