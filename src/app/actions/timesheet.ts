"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function approveTimesheet(timesheetId: string) {
  try {
    const session = await auth();
    const isAuthorized = session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER";

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: Administrative access required" };
    }

    await prisma.timesheet.update({
      where: { id: timesheetId },
      data: { isApproved: true },
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/timesheets");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve timesheet:", error);
    return { success: false, error: "Failed to approve timesheet" };
  }
}
