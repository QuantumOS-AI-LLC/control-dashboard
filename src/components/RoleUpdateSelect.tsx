"use client";
import { useState } from "react";
import { Role } from "@prisma/client";
import { updateUserRole } from "@/app/actions/user";
import { UserCog, Loader2, CheckCircle2 } from "lucide-react";

export default function RoleUpdateSelect({ userId, initialRole }: { userId: string, initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as Role;
    setIsUpdating(true);
    const result = await updateUserRole(userId, newRole);
    setIsUpdating(false);

    if (result.success) {
      setRole(newRole);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      alert("Error updating role.");
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl transition-all ${isUpdating ? "bg-indigo-600/10" : "bg-[#0A0A0B]"} border border-gray-800`}>
          {isUpdating ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" /> : <UserCog className="w-4 h-4 text-indigo-400" />}
        </div>
        <select
          value={role}
          onChange={handleRoleChange}
          disabled={isUpdating}
          className={`
            bg-transparent text-xs font-bold uppercase tracking-widest text-indigo-400 outline-none cursor-pointer hover:text-white transition-colors
            ${isUpdating ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          {Object.values(Role).map((r) => (
            <option key={r} value={r} className="bg-[#14151A] text-white">
              {r}
            </option>
          ))}
        </select>
        {showSuccess && (
           <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-in fade-in zoom-in duration-300" />
        )}
      </div>
    </div>
  );
}
