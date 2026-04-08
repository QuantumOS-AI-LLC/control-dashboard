import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const materials = await prisma.material.findMany({ orderBy: { createdAt: "desc" }, include: { job: { select: { customerName: true, title: true } } } });
    return NextResponse.json(materials);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = await req.json();
    const totalCost = (data.quantity ?? 0) * (data.costPerUnit ?? 0);
    const material = await prisma.material.create({ data: { ...data, totalCost } });
    return NextResponse.json(material, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
