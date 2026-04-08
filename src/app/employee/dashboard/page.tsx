import React from "react";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/SignOutButton";
import { auth } from "@/auth";
import { Laptop, CheckCircle2, ChevronRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";

export default async function EmployeeDashboard() {
  const session = await auth();
  
  // 1. Multi-timezone safe day lookup (48H centered window)
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  
  const yesterdayUTC = new Date(todayUTC);
  yesterdayUTC.setUTCDate(todayUTC.getUTCDate() - 1);
  
  const tomorrowUTC = new Date(todayUTC);
  tomorrowUTC.setUTCDate(todayUTC.getUTCDate() + 1);

  const todaysLogIds = await prisma.timesheet.findMany({
    where: {
      employeeId: session?.user?.id as string,
      date: {
        gte: yesterdayUTC,
        lte: tomorrowUTC
      }
    },
    select: { jobId: true }
  }).then(logs => logs.map(l => l.jobId));

  // 2. Fetch ALL available jobs to show them in the board
  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
    },
    select: {
      id: true,
      customerName: true,
      title: true,
      address: true
    }
  });

  // 3. For the UI convenience, map names and log status
  const jobsToDisplay = jobs.map(j => ({
    id: j.id,
    title: j.customerName ? `${j.customerName}'s Installation` : (j.title || "Unnamed Installation"),
    address: j.address || "No address provided",
    isLoggedToday: todaysLogIds.includes(j.id)
  }));

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

        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-[11px] text-gray-500 font-black uppercase tracking-[0.3em]">Active Project Board</h2>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold uppercase">{jobsToDisplay.length} Available</span>
           </div>

           {jobsToDisplay.length === 0 ? (
              <div className="bg-gray-900/40 border border-dashed border-gray-800 p-12 rounded-[2.5rem] text-center">
                 <p className="text-gray-500 font-medium italic">No projects are currently in the installation pipeline.</p>
              </div>
           ) : (
              <div className="grid grid-cols-1 gap-6">
                 {jobsToDisplay.map(job => (
                    <div key={job.id} className="group bg-[#14151A]/90 backdrop-blur-xl rounded-[2.5rem] border border-gray-800/80 p-8 shadow-2xl hover:border-indigo-500/40 transition-all relative overflow-hidden">
                       <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6 gap-4">
                             <div>
                                <h3 className="text-2xl font-black text-white tracking-tight uppercase group-hover:text-indigo-400 transition-colors leading-tight">{job.title}</h3>
                                <p className="text-gray-500 text-sm font-medium flex items-center gap-2 mt-2 italic line-clamp-1">
                                   <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {job.address}
                                </p>
                             </div>
                             {job.isLoggedToday && (
                                <div className="shrink-0 bg-emerald-500/10 text-emerald-400 text-[10px] px-4 py-2 rounded-full border border-emerald-500/20 font-black uppercase tracking-widest flex items-center gap-2 animate-in fade-in zoom-in duration-500">
                                   <CheckCircle2 className="w-4 h-4" /> Verified
                                </div>
                             )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
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
