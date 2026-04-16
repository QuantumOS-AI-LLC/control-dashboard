import React from "react";
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import SignOutButton from "@/components/SignOutButton";
import { auth } from "@/auth";
import { 
  Laptop, 
  CheckCircle2, 
  ChevronRight, 
  Clock, 
  MapPin, 
  Phone, 
  MessageSquare,
  Mail 
} from "lucide-react";
import Link from "next/link";

export default async function EmployeeDashboard() {
  const session = await auth();
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id as string },
    select: { payRate: true }
  });
  const payRate = user?.payRate || 0;
  
  // 1. Multi-timezone safe day lookup (48H centered window)
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  
  const yesterdayUTC = new Date(todayUTC);
  yesterdayUTC.setUTCDate(todayUTC.getUTCDate() - 1);
  
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

  // 2. Fetch all timesheets for this employee to calculate totals per job
  const allTimesheets = await prisma.timesheet.findMany({
    where: { employeeId: session?.user?.id as string },
    select: {
      jobId: true,
      totalHours: true,
      date: true,
      status: true,
      rejectionReason: true
    }
  });

  // Calculate today's logged jobs
  const todaysLogIds = allTimesheets
    .filter(t => t.date >= yesterdayUTC && t.date <= tomorrowUTC)
    .map(t => t.jobId);

  // Group total hours by jobId
  const hoursPerJob = allTimesheets.reduce((acc, t) => {
    if (t.status === "APPROVED") {
      acc[t.jobId] = (acc[t.jobId] || 0) + t.totalHours;
    }
    return acc;
  }, {} as Record<string, number>);

  // 3. Fetch ALL jobs
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customerName: true,
      title: true,
      address: true,
      status: true,
      isDisabled: true,
      customerPhone: true,
      customerEmail: true,
      dispatchNotes: true,
    }
  });

  // 4. For the UI convenience, map names and log status
  const jobsToDisplay = jobs.map(j => {
    const totalHours = hoursPerJob[j.id] || 0;
    const totalEarnings = totalHours * payRate;
    
    return {
      id: j.id,
      title: j.customerName ? `${j.customerName}'s Installation` : (j.title || "Unnamed Installation"),
      address: j.address || "No address provided",
      status: j.status,
      isDisabled: j.isDisabled,
      totalHours: totalHours.toFixed(1),
      totalEarnings: totalEarnings.toFixed(2),
      isLoggedToday: todaysLogIds.includes(j.id),
      customerPhone: j.customerPhone,
      customerEmail: j.customerEmail,
      dispatchNotes: j.dispatchNotes,
    };
  });

  // Calculate high-level metrics
  const stats = {
    totalCompleted: jobs.filter(j => j.status === JobStatus.Completed || j.status === JobStatus.Paid || j.isDisabled).length,
    activeJobs: jobs.filter(j => j.status !== JobStatus.Completed && j.status !== JobStatus.Paid && !j.isDisabled).length,
    totalEarnings: Object.values(hoursPerJob).reduce((sum, hrs) => sum + (hrs * payRate), 0).toFixed(2)
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8 z-10 relative">
        <div className="flex justify-between items-center bg-[#14151A]/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-gray-800">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600/20 p-2.5 rounded-2xl text-indigo-400 border border-indigo-500/30">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">Military Grade Dispatch</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1.5 font-bold">{session?.user?.role} Portal</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-[#14151A]/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-800 shadow-xl">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Earning Power</p>
              <h3 className="text-2xl font-black text-emerald-400 leading-none">${stats.totalEarnings}</h3>
              <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-tighter">Gross to Date</p>
           </div>
           <div className="bg-[#14151A]/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-800 shadow-xl">
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Deployments</p>
              <h3 className="text-2xl font-black text-indigo-400 leading-none">{stats.totalCompleted} / {jobs.length}</h3>
              <p className="text-[9px] text-gray-600 mt-2 font-bold uppercase tracking-tighter">Completed vs Total</p>
           </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em]">Operational Theater</h2>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold uppercase">{stats.activeJobs} Active</span>
           </div>

           {jobsToDisplay.length === 0 ? (
              <div className="bg-gray-900/40 border border-dashed border-gray-800 p-12 rounded-[2.5rem] text-center">
                 <p className="text-gray-500 font-medium italic">No projects are currently in the installation pipeline.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 gap-6">
                 {jobsToDisplay.map(job => (
                    <div key={job.id} className={`group bg-[#14151A]/90 backdrop-blur-xl rounded-[2.5rem] border ${job.status === 'Completed' || job.status === 'Paid' ? 'border-emerald-500/20' : 'border-gray-800/80'} p-8 shadow-2xl hover:border-indigo-500/40 transition-all relative overflow-hidden`}>
                       <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6 gap-4">
                             <div>
                                <div className="flex items-center gap-3 mb-2">
                                   <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                                      job.status === 'Completed' || job.status === 'Paid' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                   }`}>
                                      {job.status}
                                   </span>
                                </div>
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors leading-tight">{job.title}</h3>
                                <p className="text-gray-500 text-sm font-medium flex items-center gap-2 mt-2 italic line-clamp-1">
                                   <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.address}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-3">
                                   {job.customerPhone && (
                                      <a href={`tel:${job.customerPhone}`} className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 hover:text-indigo-400 transition-colors bg-gray-900/40 px-3 py-1.5 rounded-xl border border-gray-800/50">
                                         <Phone className="w-3 h-3 text-indigo-500" /> {job.customerPhone}
                                      </a>
                                   )}
                                   {job.customerEmail && (
                                      <a href={`mailto:${job.customerEmail}`} className="text-[10px] text-gray-400 font-bold flex items-center gap-1.5 hover:text-indigo-400 transition-colors bg-gray-900/40 px-3 py-1.5 rounded-xl border border-gray-800/50">
                                         <Mail className="w-3 h-3 text-indigo-500" /> {job.customerEmail}
                                      </a>
                                   )}
                                </div>
                                <div className="flex flex-col gap-2 mt-4">
                                   {allTimesheets
                                      .filter(t => t.jobId === job.id && t.status === "REJECTED")
                                      .map((t, idx) => (
                                        <div key={idx} className="text-[9px] text-red-400 font-bold uppercase tracking-tighter bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-start gap-2">
                                          <span className="shrink-0 w-1 h-1 rounded-full bg-red-500 mt-1" />
                                          <span>{t.rejectionReason || "Timesheet rejected by admin."}</span>
                                        </div>
                                      ))
                                   }
                                </div>
                             </div>
                             {job.isLoggedToday && (
                                <div className="shrink-0 bg-emerald-500/10 text-emerald-400 text-[10px] px-4 py-2 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in zoom-in duration-500">
                                   <CheckCircle2 className="w-4 h-4" /> Logged
                                </div>
                             )}
                          </div>

                          <div className="mt-6 flex gap-6 border-y border-gray-800/50 py-4 mb-8">
                             <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Time Invested</p>
                                <p className="text-lg font-black text-white">{job.totalHours} <span className="text-xs text-gray-600 ml-1">HRS</span></p>
                             </div>
                             <div className="w-[1px] bg-gray-800/50" />
                             <div>
                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Project Yield</p>
                                <p className="text-lg font-black text-emerald-400">${job.totalEarnings}</p>
                             </div>
                          </div>

                          {!job.isDisabled && job.status !== 'Completed' && job.status !== 'Paid' && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Link 
                                   href={job.isLoggedToday ? "#" : `/employee/log/${job.id}`} 
                                   className={`flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                                      job.isLoggedToday 
                                      ? "bg-gray-900/60 text-gray-700 border border-gray-800/50 cursor-not-allowed" 
                                      : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_10px_40px_rgba(79,70,229,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                                   } shadow-xl`}
                                >
                                   <Clock className={`w-4 h-4 ${job.isLoggedToday ? "text-gray-700" : "text-white"}`} /> 
                                   {job.isLoggedToday ? "Shift Locked" : "Log Daily Progress"}
                                </Link>

                                <Link 
                                   href={`/employee/complete/${job.id}`}
                                   className="flex items-center justify-center gap-3 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] group/comp shadow-xl"
                                >
                                   <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover/comp:scale-110 transition-transform" /> 
                                   Final Close-Out
                                </Link>
                             </div>
                          )}

                          {job.isDisabled && (
                             <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-2xl flex items-center justify-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Job Fully Finalized - Logging Restricted</p>
                             </div>
                          )}
                       </div>
                       
                       {/* Background decoration */}
                       <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                          <Laptop className="w-40 h-40 text-white" />
                       </div>
                    </div>
                 ))}
              </div>
           )}
        </div>
        
        <div className="pt-6 border-t border-gray-800/50 flex flex-col items-center opacity-40">
            <p className="text-[10px] text-gray-600 uppercase tracking-[0.5em] font-black">
                FenceForce Tactical • v2.1.0
            </p>
        </div>
      </div>
    </div>
  );
}
