import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import JobTable from "@/components/admin/JobTable";
import JobsHeader from "@/components/admin/JobsHeader";

export const dynamic = 'force-dynamic';

export default async function JobsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === JobStatus.In_Progress).length,
    scheduled: jobs.filter(j => j.status === JobStatus.Scheduled).length,
    completed: jobs.filter(j => j.status === JobStatus.Completed).length,
    paid: jobs.filter(j => j.status === JobStatus.Paid).length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <JobsHeader />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-[#14151A] border border-gray-800 p-4 rounded-2xl">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Total Orders</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
         </div>
         <div className="bg-[#14151A] border border-gray-800 p-4 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.05)]">
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1">Active Now</p>
            <p className="text-2xl font-bold text-white">{stats.active}</p>
         </div>
         <div className="bg-[#14151A] border border-gray-800 p-4 rounded-2xl">
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Upcoming</p>
            <p className="text-2xl font-bold text-white">{stats.scheduled}</p>
         </div>
         <div className="bg-[#14151A] border border-gray-800 p-4 rounded-2xl">
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-1">Paid & Closed</p>
            <p className="text-2xl font-bold text-white">{stats.paid}</p>
         </div>
      </div>

<<<<<<< HEAD
      <JobTable initialJobs={jobs} />
=======
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {jobs.map((job) => {
           const config = getStatusConfig(job.status);
           return (
              <div key={job.id} className="bg-[#14151A]/80 backdrop-blur-md border border-gray-800 rounded-3xl p-6 group hover:translate-y-[-4px] transition-all relative overflow-hidden shadow-xl">
                 {/* Status Badge */}
                 <div className={`absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest ${config.color}`}>
                    {config.icon} {job.status}
                 </div>

                 <div className="space-y-4">
                    <div className="pr-20">
                       <h3 className="text-lg font-extrabold text-white group-hover:text-indigo-400 transition-all truncate">
                          {job.customerName ? `${job.customerName}'s Installation` : job.title || "Unnamed Installation"}
                       </h3>
                       <a 
                         href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${job.address}, ${job.city || ""} ${job.postalCode || ""}`)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 text-xs text-gray-400 mt-1 hover:text-indigo-400 transition-colors"
                       >
                          <MapPin className="w-3.5 h-3.5 text-indigo-500" /> 
                          {job.address}, {job.city || ""} {job.postalCode || ""}
                       </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-800/50">
                       <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 leading-tight">Installation Schedule</p>
                          <div className="flex items-center gap-2">
                             <div className="p-1 px-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center">
                                <span className="text-[8px] text-indigo-400 font-bold uppercase">{job.scheduledDate.toLocaleDateString(undefined, {month: 'short'})}</span>
                                <span className="text-xs font-black text-white">{job.scheduledDate.getDate()}</span>
                             </div>
                             <div>
                                <span className="text-[10px] block font-bold text-gray-300">{job.scheduledTime || "08:00 AM"}</span>
                                <span className="text-[9px] block text-gray-600 font-medium">Arrival Window</span>
                             </div>
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 leading-tight">Field Crew</p>
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <Users className="w-4 h-4 text-emerald-400" />
                             </div>
                             <div>
                                <span className="text-[10px] block font-bold text-gray-100">{job.foreman || "Unassigned"}</span>
                                <span className="text-[9px] block text-gray-600 font-medium">Foreman Lead</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Resources */}
                    <div className="flex gap-2">
                       {job.materialListUrl && (
                          <a href={job.materialListUrl} target="_blank" className="flex-1 px-3 py-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-[9px] font-bold text-indigo-400 hover:bg-indigo-600/20 transition-all text-center">Material List</a>
                       )}
                       {job.scopeDocumentUrl && (
                          <a href={job.scopeDocumentUrl} target="_blank" className="flex-1 px-3 py-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-[9px] font-bold text-emerald-400 hover:bg-emerald-600/20 transition-all text-center">Scope Doc</a>
                       )}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                       <JobStatusToggle jobId={job.id} initialStatus={job.status} />
                       <Link href={`/admin/jobs/${job.id}`} className="p-2 hover:bg-gray-800 rounded-xl transition-all group/btn">
                          <ChevronRight className="w-4 h-4 text-gray-600 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                       </Link>
                    </div>
                 </div>
              </div>
           );
        })}
      </div>
>>>>>>> d134cc7d99decb348d91df992b95c9b891f3c8c4
    </div>
  );
}
