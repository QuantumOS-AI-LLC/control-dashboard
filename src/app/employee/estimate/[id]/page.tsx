import React from "react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import EmployeeEstimateForm from "@/components/EmployeeEstimateForm";
import Link from "next/link";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Mail,
  Calendar,
  Clock
} from "lucide-react";
import { notFound, redirect } from "next/navigation";

export default async function EmployeeEstimatePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  
  // Fetch specific job
  const job = await prisma.job.findUnique({
    where: { id },
  });

  if (!job) notFound();
  if (job.isDisabled) redirect("/employee/dashboard");

  const formattedJob = {
    id: job.id,
    title: job.customerName ? `${job.customerName}'s Estimate Visit` : (job.title || "Unnamed Estimate"),
    address: job.address,
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-xl mx-auto space-y-6">
        <Link 
          href="/employee/dashboard" 
          className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-indigo-400 transition-all mb-4 uppercase tracking-[0.2em] font-black group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> Return to Board
        </Link>

        {/* Job Info Header Card */}
        <div className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl space-y-6">
           <div className="flex justify-between items-start">
              <div>
                 <span className="inline-block bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] px-2.5 py-0.5 rounded-md font-black uppercase tracking-widest mb-3">
                   Estimate Appointment
                 </span>
                 <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-2">
                   {job.customerName || "Customer Details"}
                 </h1>
                 <p className="text-gray-500 text-sm font-medium flex items-center gap-2 italic">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.address || "Address TBD"}
                 </p>
              </div>
              {job.customerPhone && (
                 <a 
                   href={`tel:${job.customerPhone}`} 
                   className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl text-indigo-400 hover:bg-indigo-500/20 transition-all active:scale-95"
                 >
                    <Phone className="w-6 h-6" />
                 </a>
              )}
           </div>

           {/* Schedule Box */}
           <div className="grid grid-cols-2 gap-4 border-t border-gray-800/50 pt-6">
             <div>
               <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1">Appointment Date</span>
               <div className="flex items-center gap-2 text-sm font-bold text-white">
                 <Calendar className="w-4 h-4 text-indigo-400" />
                 <span>
                   {job.estimateDate 
                     ? new Date(job.estimateDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) 
                     : "TBD"}
                 </span>
               </div>
             </div>
             <div>
               <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1">Appointment Time</span>
               <div className="flex items-center gap-2 text-sm font-bold text-white">
                 <Clock className="w-4 h-4 text-indigo-400" />
                 <span>{job.estimateTime || "TBD"}</span>
               </div>
             </div>
           </div>

           {job.dispatchNotes && (
              <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl relative">
                 <MessageSquare className="absolute top-4 right-4 w-4 h-4 text-indigo-500/20" />
                 <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2 font-bold italic underline underline-offset-4">
                   Dispatch / Gate Code Notes
                 </p>
                 <p className="text-sm text-gray-200 leading-relaxed italic">"{job.dispatchNotes}"</p>
              </div>
           )}

           {job.customerEmail && (
             <div className="border-t border-gray-800 pt-6">
               <span className="text-[8px] text-gray-500 uppercase tracking-widest block mb-1.5">Contact Email</span>
               <a 
                 href={`mailto:${job.customerEmail}`} 
                 className="flex items-center gap-2 text-xs text-gray-300 hover:text-indigo-400 transition-colors"
               >
                 <Mail className="w-4 h-4 text-indigo-500" />
                 <span>{job.customerEmail}</span>
               </a>
             </div>
           )}
        </div>

        {/* Map */}
        {job.address && (
          <div className="w-full h-48 rounded-[2rem] overflow-hidden border border-gray-800 shadow-2xl relative">
             <iframe
                title="Estimate Location Map"
                width="100%"
                height="100%"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(job.address)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
             />
             <div className="absolute top-4 right-4 bg-gray-900/80 backdrop-blur-md p-2 rounded-xl border border-white/5 pointer-events-none">
                <MapPin className="w-4 h-4 text-indigo-400" />
             </div>
          </div>
        )}

        {/* Estimate Form */}
        <EmployeeEstimateForm job={formattedJob} />
      </div>
    </div>
  );
}
