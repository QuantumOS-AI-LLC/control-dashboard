"use client";
import { useState } from "react";
import { JobStatus } from "@prisma/client";
import { updateJobStatus } from "@/app/actions/job";
import { Loader2, RefreshCw } from "lucide-react";

export default function JobStatusToggle({ jobId, initialStatus }: { jobId: string, initialStatus: JobStatus }) {
  const [status, setStatus] = useState<JobStatus>(initialStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const nextStatusMap: Record<JobStatus, JobStatus> = {
    [JobStatus.SCHEDULED]: JobStatus.IN_PROGRESS,
    [JobStatus.IN_PROGRESS]: JobStatus.COMPLETED,
    [JobStatus.COMPLETED]: JobStatus.INVOICED,
    [JobStatus.INVOICED]: JobStatus.PAID,
    [JobStatus.PAID]: JobStatus.SCHEDULED, // Loop for demo
    [JobStatus.CANCELLED]: JobStatus.SCHEDULED,
  };

  const handleToggle = async () => {
    const nextStatus = nextStatusMap[status];
    setIsUpdating(true);
    const result = await updateJobStatus(jobId, nextStatus);
    setIsUpdating(false);

    if (result.success) {
      setStatus(nextStatus);
    } else {
      alert("Error updating job status.");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all
        ${isUpdating ? "opacity-50" : "hover:scale-105 active:scale-95"}
        ${status === JobStatus.COMPLETED ? "bg-gray-500/10 border-gray-500/30 text-gray-400" : "bg-indigo-600/10 border-indigo-500/30 text-indigo-400"}
      `}
    >
      {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
      {status === JobStatus.PAID ? "Payment Received" : "Advance Pipeline"}
    </button>
  );
}
