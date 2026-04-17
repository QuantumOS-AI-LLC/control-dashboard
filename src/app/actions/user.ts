"use server";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath("/admin/employees");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: "Failed to update role" };
  }
}

export async function updateUser(userId: string, data: any) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    revalidatePath("/admin/employees");
    return { success: true, user: updated };
  } catch (error) {
    console.error("Failed to update user:", error);
    return { success: false, error: "Failed to update user" };
  }
}
