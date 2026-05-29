import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { planFileData, localisationCertificateData } = body;

    if (!planFileData && !localisationCertificateData) {
      return NextResponse.json({ error: "No document data provided" }, { status: 400 });
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update job with base64 data
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        planFileData: planFileData || job.planFileData,
        localisationCertificateData: localisationCertificateData || job.localisationCertificateData,
      },
    });

    // Trigger webhook to n8n to notify that documents were uploaded
    // (This allows n8n to advance the GHL pipeline stage to "Ready for Schedule")
    const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "job_updated",
            action_name: "documents_uploaded",
            timestamp: new Date().toISOString(),
            payload: {
              jobId: updatedJob.id,
              ghlJobId: updatedJob.ghlJobId,
              customerName: updatedJob.customerName,
              hasPlanFile: !!updatedJob.planFileData,
              hasCertificateFile: !!updatedJob.localisationCertificateData,
            }
          }),
        });
      } catch (webhookError) {
        console.error("Failed to notify n8n about document upload:", webhookError);
        // We don't fail the client request if the webhook fails, but we log it.
      }
    }

    return NextResponse.json({ success: true, message: "Documents saved successfully." });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
