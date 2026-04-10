"use client";

import { useState } from "react";
import { User, Role } from "@prisma/client";
import { Users, Check, ChevronsUpDown, Loader2, Save } from "lucide-react";
import { assignJobTeam } from "@/app/actions/job";

interface CrewAssignmentProps {
  jobId: string;
  allUsers: User[];
  currentForemanId: string | null;
  currentCrewIds: string[];
}

export default function CrewAssignment({ jobId, allUsers, currentForemanId, currentCrewIds }: CrewAssignmentProps) {
  const [foremanId, setForemanId] = useState(currentForemanId || "");
  const [crewIds, setCrewIds] = useState<string[]>(currentCrewIds);
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Filter for potential foremen (Admins, Managers, Foremen)
  const potentialForemen = allUsers.filter(u => 
    ([Role.ADMIN, Role.MANAGER, Role.FOREMAN] as Role[]).includes(u.role)
  );

  const toggleCrewMember = (id: string) => {
    setCrewIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsUpdating(true);
    setMessage(null);
    
    const result = await assignJobTeam(jobId, foremanId, crewIds);
    
    setIsUpdating(false);
    if (result.success) {
      setMessage({ type: 'success', text: "Crew assignment updated & synced to GHL" });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: "Failed to update assignment" });
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed flex items-center justify-center animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Foreman Selection */}
      <div>
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] block mb-3">Project Foreman Lead</label>
        <div className="relative group">
           <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-emerald-400 transition-colors" />
           <select 
             value={foremanId}
             onChange={(e) => setForemanId(e.target.value)}
             className="w-full pl-12 pr-4 py-3.5 bg-gray-950/50 border border-gray-800 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all appearance-none"
           >
             <option value="">Unassigned</option>
             {potentialForemen.map(u => (
               <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
             ))}
           </select>
           <ChevronsUpDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 pointer-events-none" />
        </div>
      </div>

      {/* Crew Multi-Selection */}
      <div>
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] block mb-3">Installation Crew</label>
        <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
          {allUsers.map(user => {
            const isSelected = crewIds.includes(user.id);
            return (
              <button
                key={user.id}
                onClick={() => toggleCrewMember(user.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                  isSelected 
                  ? 'bg-indigo-600/10 border-indigo-500/40 text-white' 
                  : 'bg-gray-950/30 border-gray-800/50 text-gray-500 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'bg-gray-800'}`} />
                   <div>
                      <p className="text-xs font-bold leading-none">{user.name}</p>
                      <p className="text-[9px] uppercase tracking-widest mt-1 opacity-50">{user.role}</p>
                   </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isUpdating}
        className="w-full flex items-center justify-center gap-3 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-[0.98]"
      >
        {isUpdating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        Update Installation Team
      </button>
    </div>
  );
}
