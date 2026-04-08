"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  Briefcase, 
  Clock, 
  UserPlus, 
  LogOut,
  Menu,
  X,
  HardHat,
  Package,
  DollarSign,
  PhoneCall
} from "lucide-react";
import { useState } from "react";
import SignOutButton from "./SignOutButton";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart3 },
    { name: "Contacts", href: "/admin/contacts", icon: PhoneCall },
    { name: "Job Tracker", href: "/admin/jobs", icon: Briefcase },
    { name: "Employees", href: "/admin/employees", icon: Users },
    { name: "Materials", href: "/admin/materials", icon: Package },
    { name: "Timesheet Log", href: "/admin/timesheets", icon: Clock },
    { name: "Payroll", href: "/admin/payroll", icon: DollarSign },
    { name: "Onboarding", href: "/admin/onboarding", icon: UserPlus },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1C1A31] border border-gray-800 rounded-lg text-white"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0A0A0B] border-r border-gray-800 transition-transform duration-300 transform
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        flex flex-col
      `}>
        {/* Brand */}
        <div className="p-6 border-b border-gray-800/50 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
             <HardHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white tracking-widest uppercase">FenceForce</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                  ${isActive 
                    ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50"}
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-indigo-400" : "group-hover:text-white"}`} />
                <span className="text-sm font-semibold">{item.name}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="p-4 bg-[#14151A] rounded-xl border border-gray-800 mb-4">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Connected Database</p>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-xs text-white font-medium">Neon PostgreSQL</span>
            </div>
          </div>
          <SignOutButton className="w-full justify-start px-4 text-gray-400 hover:text-red-400 hover:bg-red-500/10" />
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}
    </>
  );
}
