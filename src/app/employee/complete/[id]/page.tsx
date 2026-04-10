import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EmployeeCompletionForm from "@/components/EmployeeCompletionForm";
import Link from "next/link";
import { ChevronLeft, MapPin } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EmployeeCompletePage({ params }: { params: Promise<{ id: string }> }) {
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
        <Link href="/employee/dashboard" className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-emerald-400 transition-all mb-4 uppercase tracking-[0.2em] font-black group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> Return to Board
        </Link>

        {/* Rapid Deployment Map */}
        <div className="w-full h-48 rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl relative mb-6">
           <iframe
              title="Deployment Map"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${encodeURIComponent(job.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
           />
           <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md p-2 rounded-xl border border-white/5 pointer-events-none">
              <MapPin className="w-4 h-4 text-emerald-400" />
           </div>
        </div>

        <EmployeeCompletionForm availableJobs={availableJobs} initialJobId={job.id} />
      </div>
    </div>
  );
}
