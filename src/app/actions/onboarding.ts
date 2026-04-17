"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveUser(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { employeeStatus: "ACTIVE" },
    });
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
