import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const payrolls = await prisma.payroll.findMany({
      orderBy: { payPeriodStart: "desc" },
      include: { employee: { select: { name: true, email: true } } }
    });
    return NextResponse.json(payrolls);
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const data = await req.json();
    const overtimeRate = data.hourlyRate * 1.5;
    const regularPay = data.regularHours * data.hourlyRate;
    const overtimePay = (data.overtimeHours || 0) * overtimeRate;
    const grossPay = regularPay + overtimePay;
    const netPay = grossPay - (data.deductions || 0);
    const payroll = await prisma.payroll.create({
      data: { ...data, overtimeRate, regularPay, overtimePay, grossPay, netPay }
    });
    return NextResponse.json(payroll, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
