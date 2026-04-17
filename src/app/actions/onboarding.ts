"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { employeeStatus: "ACTIVE" },
    });

    // Post to Webhook with specific action name upon approval
    const webhookUrl = process.env.ONBOARDING_WEBHOOK_URL;
    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action_name: "employee_onboarding",
          payload: {
            userId: user.id,
            name: user.name,
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

    revalidatePath("/admin/onboarding");
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve user:", error);
    return { success: false, error: "Failed to approve user" };
  }
}

export async function rejectUser(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { employeeStatus: "REJECTED" },
    });
    revalidatePath("/admin/onboarding");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject user:", error);
    return { success: false, error: "Failed to reject user" };
  }
}

export async function getPendingUsers() {
  try {
    return await prisma.user.findMany({
      where: { employeeStatus: "PENDING_APPROVAL" },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch pending users:", error);
    return [];
  }
}
