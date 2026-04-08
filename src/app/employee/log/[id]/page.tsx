import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EmployeeTimesheetForm from "@/components/EmployeeTimesheetForm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EmployeeLogPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  
  // Fetch specific job
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) notFound();

  const availableJobs = [{
    id: job.id,
    title: job.customerName ? `${job.customerName}'s Installation` : (job.title || "Unnamed Installation"),
    address: job.address
  }];

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        <Link href="/employee/dashboard" className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-indigo-400 transition-all mb-4 uppercase tracking-[0.2em] font-black group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> Back to Dispatch
        </Link>
        <EmployeeTimesheetForm availableJobs={availableJobs} initialJobId={job.id} />
      </div>
    </div>
  );
}
