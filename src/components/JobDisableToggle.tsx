"use client";
import { useState } from "react";
import { toggleJobDisabled } from "@/app/actions/job";
import { Loader2, Lock, Unlock } from "lucide-react";

export default function JobDisableToggle({ jobId, initialDisabled }: { jobId: string, initialDisabled: boolean }) {
  const [isDisabled, setIsDisabled] = useState(initialDisabled);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    setIsUpdating(true);
    const result = await toggleJobDisabled(jobId, isDisabled);
    setIsUpdating(false);

    if (result.success) {
      setIsDisabled(result.isDisabled ?? !isDisabled);
    } else {
      alert("Error updating job status.");
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      title={isDisabled ? "Unlock Job" : "Lock Job"}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest border transition-all
        ${isUpdating ? "opacity-50" : "hover:scale-105 active:scale-95"}
        ${isDisabled 
          ? "bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]" 
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"}
      `}
    >
      {isUpdating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isDisabled ? (
        <Lock className="w-3.5 h-3.5" />
      ) : (
        <Unlock className="w-3.5 h-3.5" />
      )}
      {isDisabled ? "Finalized / Locked" : "Permit Logging"}
    </button>
  );
}
