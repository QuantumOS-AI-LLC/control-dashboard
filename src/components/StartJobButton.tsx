"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Construction, Play } from "lucide-react";
import { advanceEmployeeJobStatus } from "@/app/actions/job";
import { JobStatus } from "@prisma/client";

interface StartJobButtonProps {
  jobId: string;
  type: "digging" | "installation";
}

export default function StartJobButton({ jobId, type }: StartJobButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const targetStatus = type === "digging" ? JobStatus.Digging_In_Progress : JobStatus.In_Progress;
      const res = await advanceEmployeeJobStatus(jobId, targetStatus);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || "Failed to update status");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const isDigging = type === "digging";

  return (
    <div className="w-full flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`flex items-center justify-center gap-3 py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 ${
          isDigging
            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 active:bg-amber-500/30"
            : "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 shadow-[0_10px_40px_rgba(79,70,229,0.25)]"
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : isDigging ? (
          <Construction className="w-4 h-4 text-amber-500" />
        ) : (
          <Play className="w-4 h-4 text-white" />
        )}
        {isLoading
          ? (isDigging ? "Starting Digging..." : "Starting Installation...")
          : isDigging
          ? "Start Digging"
          : "Start Installation"}
      </button>
      {error && (
        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider text-center mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
