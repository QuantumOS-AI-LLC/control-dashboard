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

      <JobTable initialJobs={jobs} />
    </div>
  );
}
