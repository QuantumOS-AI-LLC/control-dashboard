import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DollarSign, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

export default async function PayrollPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const payrolls = await prisma.payroll.findMany({
    orderBy: { payPeriodStart: "desc" },
    include: { employee: { select: { name: true, email: true } } }
  });

  const totalGross = payrolls.reduce((s, p) => s + p.grossPay, 0);
  const totalNet = payrolls.reduce((s, p) => s + p.netPay, 0);
  const totalPending = payrolls.filter(p => p.paymentStatus === "PENDING").length;

  const statusColors: Record<string, { cls: string; icon: React.ReactNode }> = {
    PAID: { cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="w-3 h-3" /> },
    PENDING: { cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <Clock className="w-3 h-3" /> },
    FAILED: { cls: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3 h-3" /> },
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/30">
            <DollarSign className="w-7 h-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Payroll Calculator</h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">{payrolls.length} pay records</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Records", value: payrolls.length },
            { label: "Gross Payroll", value: `$${totalGross.toFixed(2)}` },
            { label: "Net Payroll", value: `$${totalNet.toFixed(2)}` },
            { label: "Payments Pending", value: totalPending },
          ].map(stat => (
            <div key={stat.label} className="bg-[#14151A]/80 border border-gray-800 rounded-3xl p-6 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table — matches Google Sheet Payroll_Calculator columns exactly */}
        <div className="bg-[#14151A]/80 border border-gray-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/40">
                  {[
                    "Period Start", "Period End", "Employee Name", "Employee ID",
                    "Regular Hrs", "OT Hrs", "Hourly Rate", "OT Rate",
                    "Regular Pay", "OT Pay", "Gross Pay", "Deductions", "Net Pay",
                    "Status", "Payment Date", "Method"
                  ].map(h => (
                    <th key={h} className="px-4 py-4 text-left text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payrolls.length === 0 && (
                  <tr><td colSpan={16} className="text-center py-16 text-gray-600 italic">No payroll records yet. Create records via the API at /api/payroll.</td></tr>
                )}
                {payrolls.map((p, i) => {
                  const s = statusColors[p.paymentStatus] || statusColors.PENDING;
                  return (
                    <tr key={p.id} className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors ${i % 2 === 0 ? "" : "bg-gray-900/10"}`}>
                      <td className="px-4 py-4 text-gray-400 whitespace-nowrap text-[11px]">{new Date(p.payPeriodStart).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-gray-400 whitespace-nowrap text-[11px]">{new Date(p.payPeriodEnd).toLocaleDateString()}</td>
                      <td className="px-4 py-4 font-bold text-white whitespace-nowrap">{p.employee.name || "—"}</td>
                      <td className="px-4 py-4 font-mono text-[10px] text-gray-600">{p.employeeId.slice(0, 8)}…</td>
                      <td className="px-4 py-4 text-gray-400">{p.regularHours.toFixed(1)}</td>
                      <td className="px-4 py-4 text-yellow-400 font-bold">{p.overtimeHours.toFixed(1)}</td>
                      <td className="px-4 py-4 text-gray-400">${p.hourlyRate.toFixed(2)}</td>
                      <td className="px-4 py-4 text-gray-400">${p.overtimeRate.toFixed(2)}</td>
                      <td className="px-4 py-4 text-gray-300">${p.regularPay.toFixed(2)}</td>
                      <td className="px-4 py-4 text-yellow-300">${p.overtimePay.toFixed(2)}</td>
                      <td className="px-4 py-4 font-bold text-white">${p.grossPay.toFixed(2)}</td>
                      <td className="px-4 py-4 text-red-400">-${p.deductions.toFixed(2)}</td>
                      <td className="px-4 py-4 font-black text-emerald-400">${p.netPay.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase inline-flex items-center gap-1 ${s.cls}`}>
                          {s.icon}{p.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 text-[11px] whitespace-nowrap">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-4 text-gray-400">{p.paymentMethod || "—"}</td>
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
