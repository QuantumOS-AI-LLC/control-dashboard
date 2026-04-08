import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, Phone, Mail, Calendar, DollarSign } from "lucide-react";

export default async function EmployeeDatabasePage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const employees = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      payRate: true,
      hireDate: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      employeeStatus: true,
      createdAt: true,
      timesheets: { select: { totalHours: true } },
    }
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    INACTIVE: "bg-red-500/20 text-red-400 border-red-500/30",
    ON_LEAVE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-purple-600/20 p-3 rounded-2xl border border-purple-500/30">
            <Users className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Employee Database</h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">{employees.length} crew members on file</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Employees", value: employees.length },
            { label: "Active", value: employees.filter(e => e.employeeStatus === "ACTIVE").length },
            { label: "On Leave", value: employees.filter(e => e.employeeStatus === "ON_LEAVE").length },
            { label: "Inactive", value: employees.filter(e => e.employeeStatus === "INACTIVE").length },
          ].map(stat => (
            <div key={stat.label} className="bg-[#14151A]/80 border border-gray-800 rounded-3xl p-6 text-center">
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-[#14151A]/80 border border-gray-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/40">
                  {["Employee ID", "Full Name", "Phone", "Email", "Role", "Pay Rate", "Hire Date", "Emergency Contact", "Status", "Total Hours"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-16 text-gray-600 italic">No employees found.</td></tr>
                )}
                {employees.map((emp, i) => {
                  const totalHours = emp.timesheets.reduce((s, t) => s + t.totalHours, 0);
                  return (
                    <tr key={emp.id} className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors ${i % 2 === 0 ? "" : "bg-gray-900/10"}`}>
                      <td className="px-5 py-4 font-mono text-[10px] text-gray-500">{emp.id.slice(0, 10)}…</td>
                      <td className="px-5 py-4 font-bold text-white whitespace-nowrap">{emp.name || "—"}</td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{emp.phone || "—"}</td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{emp.email || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] px-3 py-1 rounded-full border font-bold uppercase bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
                          {emp.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-400">${(emp.payRate || 0).toFixed(2)}/hr</td>
                      <td className="px-5 py-4 text-gray-400 text-[11px] whitespace-nowrap">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap text-[11px]">{emp.emergencyContactName || "—"}{emp.emergencyContactPhone ? ` · ${emp.emergencyContactPhone}` : ""}</td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase ${statusColors[emp.employeeStatus] || "bg-gray-800 text-gray-500 border-gray-700"}`}>
                          {emp.employeeStatus.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-white">{totalHours.toFixed(1)} hrs</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
