"use client";

import { useState } from "react";
import { JobStatus } from "@prisma/client";
import { 
  Calendar, Clock, DollarSign, Timer, AlertOctagon, CheckCircle, 
  Users, ChevronRight, MapPin, MoreHorizontal, 
  ArrowUpRight, ArrowDownRight, TrendingUp, Search, Filter,
  CheckSquare, Square
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JobStatusToggle from "@/components/JobStatusToggle";
import JobDisableToggle from "@/components/JobDisableToggle";
import dynamic from "next/dynamic";

const MapModal = dynamic(() => import("./MapModal"), { ssr: false });

interface Job {
  id: string;
  customerName: string | null;
  title: string | null;
  address: string;
  city: string | null;
  postalCode: string | null;
  scheduledDate: Date;
  scheduledTime: string | null;
  status: JobStatus;
  foreman: string | null;
  revenue: number | null;
  totalJobCost: number | null;
  profitMargin: number | null;
  isDisabled: boolean;
}

export default function JobTable({ initialJobs }: { initialJobs: any[] }) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [foremanFilter, setForemanFilter] = useState("ALL");
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Extract unique foremen for the filter dropdown
  const foremen = Array.from(new Set(initialJobs.map(j => j.foreman).filter(Boolean))) as string[];
  const statuses = Object.values(JobStatus);

  const jobs = initialJobs.filter(job => {
    const matchesSearch = 
      (job.customerName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (job.address?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (job.title?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || job.status === statusFilter;
    const matchesForeman = foremanFilter === "ALL" || (foremanFilter === "Unassigned" ? !job.foreman : job.foreman === foremanFilter);

    return matchesSearch && matchesStatus && matchesForeman;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === jobs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(jobs.map(j => j.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Scheduled: return { color: "text-blue-400 bg-blue-500/10 border-blue-500/30", icon: <Calendar className="w-3 h-3" /> };
      case JobStatus.In_Progress: return { color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", icon: <Timer className="w-3 h-3" /> };
      case JobStatus.Completed: return { color: "text-gray-400 bg-gray-500/10 border-gray-500/30", icon: <CheckCircle className="w-3 h-3" /> };
      case JobStatus.Invoiced: return { color: "text-orange-400 bg-orange-500/10 border-orange-500/30", icon: <DollarSign className="w-3 h-3" /> };
      case JobStatus.Paid: return { color: "text-purple-400 bg-purple-500/10 border-purple-500/30", icon: <CheckCircle className="w-3 h-3" /> };
      case JobStatus.Cancelled: return { color: "text-red-400 bg-red-500/10 border-red-500/30", icon: <AlertOctagon className="w-3 h-3" /> };
      default: return { color: "text-gray-400 bg-gray-500/10 border-gray-500/30", icon: <Clock className="w-3 h-3" /> };
    }
  };

  return (
    <>
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#14151A]/50 p-4 rounded-2xl border border-gray-800">
        <div className="flex flex-1 flex-col md:flex-row gap-4 w-full">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search installations by name or address..." 
              className="w-full pl-10 pr-4 py-2 bg-[#0A0A0B] border border-gray-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2 bg-[#0A0A0B] border border-gray-800 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </select>

          <select 
            className="px-4 py-2 bg-[#0A0A0B] border border-gray-800 rounded-xl text-sm text-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
            value={foremanFilter}
            onChange={(e) => setForemanFilter(e.target.value)}
          >
            <option value="ALL">All Foremen</option>
            <option value="Unassigned">Unassigned</option>
            {foremen.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-4 animate-in fade-in slide-in-from-right-4 shrink-0 bg-indigo-600/10 px-4 py-2 rounded-xl border border-indigo-500/20">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{selectedIds.length} Selected</span>
            <div className="h-4 w-[1px] bg-indigo-500/30" />
            <button 
              onClick={() => setIsMapModalOpen(true)}
              className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5" /> Show on Map
            </button>
            <button className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-300 transition-colors ml-2">Export</button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-[#14151A]/80 backdrop-blur-xl border border-gray-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800/50 bg-gray-900/40">
                <th className="p-5 w-12">
                  <button onClick={toggleSelectAll} className="text-gray-600 hover:text-indigo-400 transition-colors">
                    {selectedIds.length === jobs.length && jobs.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                  </button>
                </th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Installation / ID</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Schedule</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Execution Team</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500">Current Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Financials</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {jobs.map((job) => {
                const config = getStatusConfig(job.status);
                const isSelected = selectedIds.includes(job.id);
                const margin = job.revenue && job.revenue > 0 
                  ? (((job.revenue - (job.totalJobCost || 0)) / job.revenue) * 100).toFixed(0)
                  : "0";

                return (
                  <tr 
                    key={job.id} 
                    onClick={(e) => {
                      // Don't navigate if clicking on buttons, inputs, or interactive controls
                      const isInteractive = (e.target as HTMLElement).closest('button, input, a, .interactive-control');
                      if (!isInteractive) {
                        router.push(`/admin/jobs/${job.id}`);
                      }
                    }}
                    className={`group cursor-pointer hover:bg-white/[0.04] transition-colors ${isSelected ? "bg-indigo-500/5" : ""}`}
                  >
                    <td className="p-5">
                      <button onClick={() => toggleSelectOne(job.id)} className="text-gray-600 hover:text-indigo-400 transition-colors">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-500" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">
                          {job.customerName || "Unnamed Customer"}
                        </span>
                        <span className="text-[10px] text-gray-600 font-bold flex items-center gap-1 mt-1 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3" /> {job.address}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center p-1 px-2.5 rounded-xl bg-gray-900 border border-gray-800">
                          <span className="text-[8px] text-gray-500 font-bold uppercase">{new Date(job.scheduledDate).toLocaleDateString(undefined, {month: 'short'})}</span>
                          <span className="text-xs font-black text-white">{new Date(job.scheduledDate).getDate()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-300">{job.scheduledTime || "08:00 AM"}</span>
                          <span className="text-[9px] text-gray-600 uppercase font-black tracking-tighter italic">Install Window</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-200">{job.foreman || "Unassigned"}</span>
                          <span className="text-[9px] text-gray-600 font-medium italic">Lead Foreman</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${config.color}`}>
                        {config.icon} {job.status}
                      </div>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-white">${job.revenue?.toLocaleString() || "0"}</span>
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[10px] text-gray-500 font-bold">${job.totalJobCost?.toLocaleString() || "0"} Cost</span>
                          <div className="w-1 h-1 rounded-full bg-gray-800" />
                          <span className={`text-[10px] font-black ${Number(margin) > 20 ? 'text-emerald-400' : 'text-amber-400'}`}>{margin}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center justify-end gap-3">
                        <JobStatusToggle jobId={job.id} initialStatus={job.status} />
                        <JobDisableToggle jobId={job.id} initialDisabled={job.isDisabled} />
                        <Link href={`/admin/jobs/${job.id}`} className="p-2 hover:bg-gray-800 rounded-xl transition-all group/btn bg-gray-900/50 border border-gray-800">
                           <ChevronRight className="w-4 h-4 text-gray-500 group-hover/btn:text-white group-hover/btn:translate-x-0.5 transition-all" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {jobs.length === 0 && (
          <div className="p-20 text-center">
            <p className="text-gray-500 font-medium animate-pulse italic">No installations found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
    {isMapModalOpen && (
      <MapModal 
        jobs={initialJobs.filter(j => selectedIds.includes(j.id))} 
        onClose={() => setIsMapModalOpen(false)} 
      />
    )}
  </>
  );
}
