"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={className || "flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-red-500 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/30 rounded-xl transition-all active:scale-95 group shadow-sm"}
    >
      <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      Sign Out
    </button>
  );
}
