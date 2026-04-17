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

    // 2. Post to Webhook with specific action name
    const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_name: "employee_onboarding", // Specific action name for n8n differentiation
          payload: {
            userId: user.id,
            firstName,
            lastName,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.employeeStatus,
            payRate: user.payRate,
            hireDate: user.hireDate,
            emergencyContactName: user.emergencyContactName,
            emergencyContactPhone: user.emergencyContactPhone,
            timestamp: new Date().toISOString()
          }
        }),
      });
    }

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Onboarding API Error:", error);
    return NextResponse.json({ error: "Failed to process onboarding" }, { status: 500 });
  }
}
