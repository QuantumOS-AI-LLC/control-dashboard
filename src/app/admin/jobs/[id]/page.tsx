import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Clock, Users, FileText, Clipboard, ExternalLink, ChevronLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import JobStatusToggle from "@/components/JobStatusToggle";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      timesheets: {
        include: { employee: true },
        orderBy: { date: 'desc' }
      },
      assignedForeman: true
    }
  });

  if (!job) notFound();

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header / Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/admin/jobs" className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-400 transition-all mb-4 group">
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-all" /> Back to Projects
          </Link>
          <h1 className="text-4xl font-black text-white tracking-tight">
            {job.customerName ? `${job.customerName}'s Installation` : job.title || "Job Details"}
          </h1>
          <p className="text-gray-500 font-medium mt-1">GHL Reference: <span className="text-indigo-400/80">{job.ghlJobId || "N/A"}</span></p>
        </div>
        <div className="bg-[#14151A] p-4 rounded-3xl border border-gray-800 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Current Pipeline</span>
            <div className="mt-1">
              <JobStatusToggle jobId={job.id} initialStatus={job.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Site Information */}
          <section className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <MapPin className="w-24 h-24 text-indigo-500" />
             </div>
             
             <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3">
                <MapPin className="w-5 h-5 text-indigo-500" /> Site Information
             </h2>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Service Address</label>
                  <p className="text-lg font-bold text-white">{job.address}</p>
                  <p className="text-gray-400">{job.city}, {job.postalCode}</p>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Installation Schedule</label>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="font-extrabold text-white">{job.scheduledDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      <p className="text-sm text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Arrival: {job.scheduledTime || "08:00 AM"}</p>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          {/* Timesheets / Work Log */}
          <section className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
             <h2 className="text-xl font-extrabold text-white mb-6 flex items-center gap-3">
                <Clipboard className="w-5 h-5 text-emerald-500" /> Labor & Progress Logs
             </h2>

             {job.timesheets.length === 0 ? (
               <div className="text-center py-12 bg-gray-900/40 rounded-3xl border border-dashed border-gray-800">
                  <p className="text-gray-500 font-medium italic">No timesheets recorded for this project yet.</p>
               </div>
             ) : (
               <div className="space-y-4">
                  {job.timesheets.map((ts) => (
                    <div key={ts.id} className="p-6 bg-gray-900/40 border border-gray-800 rounded-2xl group hover:border-indigo-500/30 transition-all">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <Users className="w-5 h-5 text-indigo-400" />
                             </div>
                             <div>
                                <p className="font-bold text-white">{ts.employee.name}</p>
                                <p className="text-xs text-gray-500">{new Date(ts.date).toLocaleDateString()}</p>
                             </div>
                          </div>
                          <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                             {ts.totalHours} hrs
                          </div>
                       </div>
                       <div className="space-y-2">
                          <p className="text-sm text-gray-300 leading-relaxed"><span className="text-indigo-400 font-bold">Tasks:</span> {ts.tasksCompleted}</p>
                          {ts.materialsUsed && (
                             <p className="text-sm text-gray-400 leading-relaxed"><span className="text-emerald-400 font-bold">Materials:</span> {ts.materialsUsed}</p>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </section>
        </div>

        {/* Right Column: Crew & Docs */}
        <div className="space-y-8">
          {/* Assignment Card */}
          <section className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Users className="w-24 h-24 text-emerald-500" />
             </div>
             
             <h2 className="text-sm font-extrabold text-emerald-400 uppercase tracking-[0.2em] mb-6">Execution Team</h2>
             
             <div className="space-y-6">
                <div>
                   <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] block mb-2">Designated Foreman</label>
                   <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-2xl border border-gray-800">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-emerald-400" />
                      </div>
                      <span className="font-black text-white">{job.foreman || "Unassigned"}</span>
                   </div>
                </div>
                
                <div>
                   <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] block mb-2">Crew Members</label>
                   <p className="text-sm text-gray-300 leading-relaxed font-medium">{job.crewMembers || "Standard installation crew"}</p>
                </div>
             </div>
          </section>

          {/* Documentation Card */}
          <section className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl">
             <h2 className="text-sm font-extrabold text-indigo-400 uppercase tracking-[0.2em] mb-6">Technical Resources</h2>
             
             <div className="space-y-3">
                {job.materialListUrl && (
                  <a href={job.materialListUrl} target="_blank" className="w-full flex items-center justify-between p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl hover:bg-indigo-500/20 transition-all group">
                    <span className="flex items-center gap-3 text-sm font-bold text-white">
                      <Clipboard className="w-4 h-4 text-indigo-400" /> Material List
                    </span>
                    <ExternalLink className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-all" />
                  </a>
                )}
                
                {job.scopeDocumentUrl && (
                  <a href={job.scopeDocumentUrl} target="_blank" className="w-full flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500/20 transition-all group">
                    <span className="flex items-center gap-3 text-sm font-bold text-white">
                      <FileText className="w-4 h-4 text-emerald-400" /> Scope Document
                    </span>
                    <ExternalLink className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-all" />
                  </a>
                )}

                {(!job.materialListUrl && !job.scopeDocumentUrl) && (
                  <p className="text-xs text-gray-600 italic">No external documents linked to this job record.</p>
                )}
             </div>
          </section>

          {/* Job Stats Summary */}
          <section className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] shadow-[0_0_50px_rgba(79,70,229,0.3)]">
             <h2 className="text-white/80 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Post-Install Completion</h2>
             {job.status === JobStatus.Completed ? (
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                    <span className="text-xl font-black">Installation Verfied</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{job.completionNotes || "Standard installation confirmed. No major issues reported."}</p>
               </div>
             ) : (
               <div className="flex items-center gap-3 text-white/50">
                  <Clock className="w-6 h-6" />
                  <span className="text-sm font-black uppercase tracking-widest italic">Awaiting Closure</span>
               </div>
             )}
          </section>
        </div>
      </div>
    </div>
  );
}
