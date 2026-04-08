import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
      completionImage,
      completionDate,
      finalMaterialsUsed,
      issuesEncountered,
      customerSatisfactionScore
    } = data;

    // Normalize incoming date to UTC 00:00:00.000 for strict daily matching
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    // 1. Create Timesheet
    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId: session.user.id,
        jobId,
        date: normalizedDate,
        startTime: startTime,
        endTime: endTime,
        totalHours: calculateHours(startTime, endTime),
        tasksCompleted,
        materialsUsed: materialsUsed || "",
      },
      include: {
        employee: true,
        job: true
      }
    });

    // 2. Handle Job Completion if toggled
    if (isCompleted) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completionNotes: completionNotes || "",
          completionImage,
          completionDate: completionDate ? new Date(completionDate) : new Date(),
          finalMaterialsUsed: finalMaterialsUsed || "",
          issuesEncountered: issuesEncountered || "",
          customerSatisfactionScore: customerSatisfactionScore || 5,
        }
      });
    }

    // 3. Post to Webhook (Non-blocking)
    const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
    if (webhookUrl) {
      // Fire and forget (or at least don't wait for success to respond to user)
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_name: isCompleted ? "job_completion" : "timesheet_submit",
          payload: {
            timesheetId: timesheet.id,
            employeeName: timesheet.employee.name,
            jobTitle: timesheet.job.title,
            jobId: timesheet.job.id,
            date: timesheet.date,
            totalHours: timesheet.totalHours,
            tasksCompleted: timesheet.tasksCompleted,
            materialsUsed: timesheet.materialsUsed,
            isCompleted,
            completionDate: isCompleted ? completionDate : null,
            customerSatisfactionScore: isCompleted ? customerSatisfactionScore : null,
            timestamp: new Date().toISOString()
          }
        }),
      }).catch(err => console.error("Webhook Call Failed:", err.message));
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
