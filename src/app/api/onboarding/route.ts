import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      firstName, 
      lastName, 
      email, 
      phone, 
      role, 
      payRate, 
      hireDate, 
      emergencyContactName, 
      emergencyContactPhone, 
      password 
    } = data;

    // 1. Create User in Database
    const user = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email,
        phone,
        password,
        role,
        payRate,
        hireDate: new Date(hireDate),
        emergencyContactName,
        emergencyContactPhone,
        employeeStatus: "PENDING_APPROVAL",
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json({ error: "Failed to process onboarding" }, { status: 500 });
  }
}
