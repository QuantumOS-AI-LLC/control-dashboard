import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EmployeeCompletionForm from "@/components/EmployeeCompletionForm";
import Link from "next/link";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Clipboard,
  Layers,
  ExternalLink,
  FileText
} from "lucide-react";
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
    address: job.address,
    status: job.status
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

           {/* Project Specs */}
           <div className="border-t border-gray-800 pt-6 space-y-4">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">Project Specifications</span>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block mb-1">Fence Type(s)</span>
                  <div className="flex flex-wrap gap-1">
                    {job.fenceTypes && job.fenceTypes.length > 0 ? (
                      job.fenceTypes.map((t, idx) => (
                        <span key={idx} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase">{t}</span>
                      ))
                    ) : (
                      <span className="text-gray-600 text-xs italic">Not Specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block mb-1">Installation Method</span>
                  <span className="text-xs font-bold text-white uppercase">{job.installationType || "In ground"}</span>
                </div>

                {job.fenceTypes?.includes("Frost") && (
                  <div className="col-span-2 bg-indigo-950/10 border border-indigo-900/30 rounded-2xl p-4 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase tracking-widest block">Height</span>
                      <span className="text-xs font-bold text-white">{job.frostHeight ? `${job.frostHeight} ft` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase tracking-widest block">Slats</span>
                      <span className="text-xs font-bold text-white">{job.frostPrivacySlats ? "With" : "Without"}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase tracking-widest block">Color</span>
                      <span className="text-xs font-bold text-white capitalize">{job.frostColor || "Black"}</span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block mb-1">Access Limitations</span>
                  <span className="text-xs font-bold text-white uppercase">{job.accessLimitations || (job.accessSkidExcavator ? "Skid/Excavator Access" : "Manual Dig Only")}</span>
                </div>

                <div>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block mb-1">Dirt Removal</span>
                  <span className="text-xs font-bold text-white uppercase">{job.bringBackDirt ? "Yes" : "No"}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block mb-1">Target Timeline</span>
                  <span className="text-xs font-bold text-white uppercase">{job.timeline || "Not Specified"}</span>
                </div>

                <div className="col-span-2">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block mb-1">Detailed Description</span>
                  <p className="text-xs text-gray-300 bg-gray-900/30 border border-gray-800/80 rounded-xl p-3 leading-relaxed">{job.detailedJobDescription || "No description provided."}</p>
                </div>
              </div>
           </div>

           {/* Project Documents */}
           {(job.planFileUrl || job.planFileData || job.localisationCertificateUrl || job.localisationCertificateData) && (
              <div className="border-t border-gray-800 pt-6 space-y-3">
                 <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest block">On-Site Resources</span>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(job.planFileUrl || job.planFileData) && (
                       <a href={job.planFileData ? `/api/jobs/${job.id}/documents/plan` : job.planFileUrl!} target="_blank" className="flex items-center justify-between p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/20 transition-all group">
                          <span className="flex items-center gap-2 text-xs font-bold text-white">
                             <Layers className="w-3.5 h-3.5 text-indigo-400" /> Fence Plan
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-all" />
                       </a>
                    )}
                    {(job.localisationCertificateUrl || job.localisationCertificateData) && (
                       <a href={job.localisationCertificateData ? `/api/jobs/${job.id}/documents/cert` : job.localisationCertificateUrl!} target="_blank" className="flex items-center justify-between p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all group">
                          <span className="flex items-center gap-2 text-xs font-bold text-white">
                             <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Localisation Cert.
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-all" />
                       </a>
                    )}
                 </div>
              </div>
           )}

           <div className="flex flex-col gap-3 border-t border-gray-800/50 pt-4">
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

        <EmployeeCompletionForm availableJobs={availableJobs} initialJobId={job.id} jobStatus={job.status} />
      </div>
    </div>
  );
}
