import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateApiRequest } from "@/lib/api-utils";
import { Role, EmployeeStatus } from "@prisma/client";

/**
 * Endpoint for n8n Workflow 3: Employee Onboarding - Form Handler (Step 20)
 * Path: /api/v1/sync/employee
 *
 * In GoHighLevel, everyone is a Contact. Employees ARE contacts.
 * The `contact_id` from GHL (ghlContactId) is the persistent, universal identifier.
 * We upsert by ghlContactId first, then fall back to email.
 */
export async function POST(req: Request) {
  try {
    const isValid = await validateApiRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.contact_id && !body.email) {
      return NextResponse.json(
        { error: "contact_id (GHL Contact ID) or email is required" },
        { status: 400 }
      );
    }

    // Build the data payload — only include fields that were sent
    const data: any = {};
    if (body.contact_id) data.ghlContactId = body.contact_id;
    if (body.full_name || body.first_name || body.last_name)
      data.name = body.full_name || `${body.first_name || ""} ${body.last_name || ""}`.trim();
    if (body.email) data.email = body.email;
    if (body.phone) data.phone = body.phone;
    if (body.role) data.role = body.role.toUpperCase() as Role;
    if (body.pay_rate !== undefined)
      data.payRate = typeof body.pay_rate === "string" ? parseFloat(body.pay_rate) : body.pay_rate;
    if (body.hire_date) data.hireDate = new Date(body.hire_date);
    if (body.emergency_contact_name) data.emergencyContactName = body.emergency_contact_name;
    if (body.emergency_contact_phone) data.emergencyContactPhone = body.emergency_contact_phone;
    if (body.status) data.employeeStatus = body.status.toUpperCase() as EmployeeStatus;

    let employee;

    // Strategy: upsert by ghlContactId if provided (preferred — GHL is source of truth)
    if (body.contact_id) {
      // Create a placeholder Contact to satisfy the foreign key constraint
      // This will be fleshed out by the actual Contact sync webhook later
      await prisma.contact.upsert({
        where: { contactId: body.contact_id },
        update: {},
        create: {
          contactId: body.contact_id,
          email: body.email,
          fullName: data.name,
        },
      });

      employee = await prisma.user.upsert({
        where: { ghlContactId: body.contact_id },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          ...data,
          password: "changeme123", // Default password for new employees
          role: data.role || Role.CREW,
          employeeStatus: data.employeeStatus || EmployeeStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Fallback: upsert by email
      employee = await prisma.user.upsert({
        where: { email: body.email },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          ...data,
          password: "changeme123",
          role: data.role || Role.CREW,
          employeeStatus: data.employeeStatus || EmployeeStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Employee synced (GHL Contact ID linked)",
      id: employee.id,
      ghlContactId: employee.ghlContactId,
      email: employee.email,
    });
  } catch (error: any) {
    console.error("Error in employee sync:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/sync/employee
 *
 * Called by n8n AFTER GHL creates the contact and returns a contact_id.
 * This stamps the ghlContactId onto the existing employee record so the
 * two systems stay in sync.
 *
 * Required body:
 *   { "contact_id": "abc123xyz", "email": "employee@example.com" }
 *
 * Optional — you can also match by internal id:
 *   { "contact_id": "abc123xyz", "employee_id": "clxxx..." }
 */
export async function PATCH(req: Request) {
  try {
    const isValid = await validateApiRequest(req);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.contact_id) {
      return NextResponse.json(
        { error: "contact_id is required" },
        { status: 400 }
      );
    }

    if (!body.email && !body.employee_id) {
      return NextResponse.json(
        { error: "Either email or employee_id is required to identify the employee" },
        { status: 400 }
      );
    }

    // Find the existing employee by email or internal ID
    const existing = await prisma.user.findFirst({
      where: body.employee_id
        ? { id: body.employee_id }
        : { email: body.email },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "No employee found matching the provided email or employee_id" },
        { status: 404 }
      );
    }

    // Create a placeholder Contact to satisfy the foreign key constraint
    await prisma.contact.upsert({
      where: { contactId: body.contact_id },
      update: {},
      create: {
        contactId: body.contact_id,
        email: existing.email,
        fullName: existing.name,
      },
    });

    // Stamp the ghlContactId onto the employee
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        ghlContactId: body.contact_id,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "GHL Contact ID linked to employee",
      id: updated.id,
      ghlContactId: updated.ghlContactId,
      email: updated.email,
    });
  } catch (error: any) {
    // Handle unique constraint (contact_id already assigned to another employee)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "This GHL Contact ID is already linked to a different employee" },
        { status: 409 }
      );
    }
    console.error("Error linking GHL Contact ID:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
