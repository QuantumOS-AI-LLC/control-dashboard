"use client";

import { useState } from "react";
import { Phone, ClipboardList, Save, CheckCircle2, Loader2 } from "lucide-react";
import { updateJobDispatchInfo } from "@/app/actions/job";

interface DispatchDetailsCardProps {
  jobId: string;
  initialPhone: string | null;
  initialNotes: string | null;
}

export default function DispatchDetailsCard({ jobId, initialPhone, initialNotes }: DispatchDetailsCardProps) {
  const [phone, setPhone] = useState(initialPhone || "");
  const [notes, setNotes] = useState(initialNotes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async () => {
    setIsUpdating(true);
    const result = await updateJobDispatchInfo(jobId, {
      customerPhone: phone,
      dispatchNotes: notes
    });
    setIsUpdating(false);

    if (result.success) {
      setLastSaved(new Date());
      setTimeout(() => setLastSaved(null), 3000);
    } else {
      alert("Failed to save dispatch details.");
    }
  };

  return (
    <section className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-10">
        <ClipboardList className="w-24 h-24 text-indigo-500" />
      </div>
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-sm font-extrabold text-indigo-400 uppercase tracking-[0.2em]">Crew Dispatch Instructions</h2>
        {lastSaved && (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 className="w-3 h-3" /> Saved Successfully
          </span>
        )}
      </div>

      <div className="space-y-6 relative z-10">
        <div>
          <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Customer Contact Number</label>
          <div className="relative group/input">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within/input:text-indigo-400 transition-colors" />
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(000) 000-0000"
              className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Internal Dispatch Notes (Gate Codes, Site Specifics)</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="Enter specific instructions for the crew here..."
            className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none leading-relaxed"
          ></textarea>
        </div>

        <button 
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] active:scale-[0.98]"
        >
          {isUpdating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating Dispatch Info...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Crew Instructions
            </>
          )}
        </button>
      </div>
    </section>
  );
}
