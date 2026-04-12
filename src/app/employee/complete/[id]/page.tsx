import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EmployeeCompletionForm from "@/components/EmployeeCompletionForm";
import Link from "next/link";
import { ChevronLeft, MapPin, Phone, MessageSquare, Clipboard } from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function EmployeeCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;
  
  // Fetch specific job
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) notFound();
  if (job.isDisabled) redirect("/employee/dashboard");

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


        {/* Dispatch Orders Card */}
        <div className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl space-y-6">
           <div className="flex justify-between items-start">
              <div>
                 <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">{job.customerName || "Project Details"}</h1>
                 <p className="text-gray-500 text-sm font-medium flex items-center gap-2 italic">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {job.address}
                 </p>
              </div>
              {job.customerPhone && (
                 <a href={`tel:${job.customerPhone}`} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-95">
                    <Phone className="w-6 h-6" />
                 </a>
              )}
           </div>

           {job.dispatchNotes && (
              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative">
                 <MessageSquare className="absolute top-4 right-4 w-4 h-4 text-emerald-500/20" />
                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest mb-2 font-bold italic underline underline-offset-4">Dispatch Instructions</p>
                 <p className="text-sm text-gray-200 leading-relaxed italic">"{job.dispatchNotes}"</p>
              </div>
           )}

           <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                 <Clipboard className="w-4 h-4 text-gray-600" />
                 <span className="font-bold uppercase tracking-widest text-[9px]">Job ID: {job.ghlJobId || job.id}</span>
              </div>
           </div>
        </div>
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
