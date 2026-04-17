"use client";

import { useState } from "react";
import { approveUser, rejectUser } from "@/app/actions/onboarding";
import { CheckCircle, XCircle, User, Mail, Phone, Calendar, DollarSign, Loader2 } from "lucide-react";

interface PendingUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  payRate: number | null;
  hireDate: Date | null;
  createdAt: Date;
}

export default function OnboardingApprovalList({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState<PendingUser[]>(initialUsers);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (userId: string) => {
    setProcessingId(userId);
    const result = await approveUser(userId);
    if (result.success) {
      setUsers(users.filter(u => u.id !== userId));
    } else {
      alert("Failed to approve user");
    }
    setProcessingId(null);
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Are you sure you want to reject this applicant?")) return;
    setProcessingId(userId);
    const result = await rejectUser(userId);
    if (result.success) {
      setUsers(users.filter(u => u.id !== userId));
    } else {
      alert("Failed to reject user");
    }
    setProcessingId(null);
  };

  if (users.length === 0) {
    return (
      <div className="bg-[#14151A]/80 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-gray-800/50 p-4 rounded-2xl">
            <CheckCircle className="w-8 h-8 text-gray-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Pending Approvals</h3>
        <p className="text-gray-400">All recent onboarding submissions have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-indigo-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-4">
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        Pending Approvals ({users.length})
      </h3>
      
      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-[#14151A]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-5 shadow-xl hover:border-gray-700 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-16 h-16 text-indigo-500" />
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold uppercase text-lg shrink-0">
                  {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg">{user.name || "Unnamed Applicant"}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Phone className="w-3.5 h-3.5 text-gray-500" />
                      {user.phone}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {user.role}
                    </span>
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5" /> {user.payRate}/hr
                    </span>
                    <span className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> Start: {user.hireDate ? new Date(user.hireDate).toLocaleDateString() : "TBD"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  disabled={processingId === user.id}
                  onClick={() => handleReject(user.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-sm font-bold disabled:opacity-50"
                >
                  {processingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
                <button
                  disabled={processingId === user.id}
                  onClick={() => handleApprove(user.id)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all text-sm font-bold disabled:opacity-50"
                >
                  {processingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
