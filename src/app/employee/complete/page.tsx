import React from "react";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { auth } from "@/auth";
import EmployeeCompletionForm from "@/components/EmployeeCompletionForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function EmployeeCompletePage() {
  const session = await auth();
  
  // Fetch available jobs from the database (only those in progress)
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: [JobStatus.In_Progress] }
    },
    select: {
      id: true,
      customerName: true,
      title: true,
      address: true
    }
  });

  const availableJobs = jobs.map(j => ({
    id: j.id,
    title: j.customerName ? `${j.customerName}'s Installation` : j.title || "Unnamed Installation",
    address: j.address
  }));

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        <Link href="/employee/dashboard" className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-400 transition-all mb-4 group lowercase tracking-widest font-black uppercase">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> Back to Logs
        </Link>
        <EmployeeCompletionForm availableJobs={availableJobs} />
      </div>
    </div>
  );
}
