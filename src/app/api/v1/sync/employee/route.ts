import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";
import { Role, EmployeeStatus } from "@prisma/client";

/**
 * Endpoint for n8n Workflow 3: Employee Onboarding - Form Handler (Step 20)
 * Path: /api/v1/sync/employee
 */
export async function POST(req: Request) {
  try {
    const isValid = await validateApiRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Map GHL fields to Prisma User model (Matches n8n Step 20.3 & 20.4)
    const employee = await prisma.user.upsert({
      where: { email: body.email },
      update: {
        name: body.full_name || `${body.first_name || ""} ${body.last_name || ""}`.trim(),
        phone: body.phone,
        role: (body.role?.toUpperCase() as Role) || Role.CREW,
        payRate: typeof body.pay_rate === "string" ? parseFloat(body.pay_rate) : body.pay_rate,
        hireDate: body.hire_date ? new Date(body.hire_date) : undefined,
        emergencyContactName: body.emergency_contact_name,
        emergencyContactPhone: body.emergency_contact_phone,
        employeeStatus: (body.status?.toUpperCase() as EmployeeStatus) || EmployeeStatus.ACTIVE,
        updatedAt: new Date(),
      },
      create: {
        email: body.email,
        name: body.full_name || `${body.first_name || ""} ${body.last_name || ""}`.trim(),
        phone: body.phone,
        password: "changeme123", // Default password for new employees
        role: (body.role?.toUpperCase() as Role) || Role.CREW,
        payRate: typeof body.pay_rate === "string" ? parseFloat(body.pay_rate) : body.pay_rate,
        hireDate: body.hire_date ? new Date(body.hire_date) : new Date(),
        emergencyContactName: body.emergency_contact_name,
        emergencyContactPhone: body.emergency_contact_phone,
        employeeStatus: (body.status?.toUpperCase() as EmployeeStatus) || EmployeeStatus.ACTIVE,
        createdAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee onboarding entry synced to database",
      id: employee.id,
      email: employee.email,
    });
  } catch (error: any) {
    console.error("Error in employee sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
