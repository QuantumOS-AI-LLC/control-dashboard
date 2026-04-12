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

    const { timesheets } = await req.json();

    for (const data of timesheets) {
      const { 
        jobId, 
        startTime, 
        endTime, 
        tasksCompleted, 
        materialsUsed, 
        date, 
        isCompleted, 
        completionNotes, 
        completionImages,
        completionDate,
        finalMaterialsUsed,
        issuesEncountered,
        customerSatisfactionScore
      } = data;

      const ts = await prisma.timesheet.create({
        data: {
          employeeId: session.user.id,
          jobId,
          date: new Date(date),
          startTime,
          endTime,
          totalHours: calculateHours(startTime, endTime),
          tasksCompleted,
          materialsUsed: materialsUsed || "",
        },
        include: { employee: true, job: true }
      });

      if (isCompleted) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: JobStatus.Completed,
            completionNotes: completionNotes || "",
            completionImages,
            completionDate: completionDate ? new Date(completionDate) : new Date(),
            finalMaterialsUsed: finalMaterialsUsed || "",
            issuesEncountered: issuesEncountered || "",
            customerSatisfactionScore: customerSatisfactionScore || 5,
          }
        });
      }

      // Fire webhook for each entry in sync
      const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action_name: isCompleted ? "job_completion" : "timesheet_submit",
            payload: {
              sync_mode: true,
              timesheetId: ts.id,
              employeeName: ts.employee.name,
              jobTitle: ts.job.title,
              date: ts.date,
              totalHours: ts.totalHours,
              isCompleted,
              timestamp: new Date().toISOString()
            }
          }),
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Timesheet Sync API Error:", error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}

function calculateHours(start: string, end: string) {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const diffInMinutes = (eH * 60 + eM) - (sH * 60 + sM);
  return parseFloat((diffInMinutes / 60).toFixed(2));
}
