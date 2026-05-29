import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string, type: string }> }) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, type } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      select: {
        planFileData: true,
        localisationCertificateData: true,
      }
    });

    if (!job) {
      return new NextResponse("Job not found", { status: 404 });
    }

    const dataString = type === "plan" ? job.planFileData : job.localisationCertificateData;

    if (!dataString) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // Extract mime type and base64 payload from data URL format (e.g., data:image/png;base64,iVBORw0KGgo...)
    const matches = dataString.match(/^data:([A-Za-z-+\/.]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      return new NextResponse("Invalid document format in database", { status: 500 });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        // Inline disposition tells the browser to display it (PDF/Image) rather than forcing download
        "Content-Disposition": `inline; filename="document-${type}-${id}.${mimeType.split('/')[1] || 'file'}"`
      }
    });

  } catch (error) {
    console.error("Document fetch error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
