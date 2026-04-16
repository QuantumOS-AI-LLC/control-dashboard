import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Clock, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";

export default async function TimesheetLogPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const allTimesheets = await prisma.timesheet.findMany({
    orderBy: { date: "desc" },
    include: {
      employee: { select: { name: true, payRate: true } },
      job: { select: { customerName: true, title: true, isDisabled: true } }
    }
  });

  // Filter out redundant 0-hour completion report rows (if any)
  const timesheets = allTimesheets.filter(t => t.totalHours > 0 || t.tasksCompleted !== "FINAL JOB COMPLETION REPORT");

  const totalHours = timesheets.reduce((s, t) => s + t.totalHours, 0);
  const totalPay = timesheets.reduce((s, t) => s + (t.totalPay || (t.totalHours * (t.hourlyRate || 0))), 0);

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-blue-600/20 p-3 rounded-2xl border border-blue-500/30">
            <Clock className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Timesheet Log</h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">{timesheets.length} entries recorded</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Entries", value: timesheets.length },
            { label: "Total Hours", value: `${totalHours.toFixed(1)} hrs` },
            { label: "Total Labor Pay", value: `$${totalPay.toFixed(2)}` },
            { label: "Pending Approval", value: timesheets.filter(t => t.status !== "APPROVED").length },
          ].map(stat => (
            <div key={stat.label} className="bg-[#14151A]/80 border border-gray-800 rounded-3xl p-6 text-center">
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Table — matches Google Sheet Timesheet_Log columns exactly */}
        <div className="bg-[#14151A]/80 border border-gray-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/40">
                  {[
                    "Timesheet ID", "Employee Name", "Employee ID", "Job ID",
                    "Job Name", "Date", "Start Time", "End Time",
                    "Hours Worked", "Hourly Rate", "Total Pay",
                    "Tasks Completed", "Materials Used", "Submitted At", "Approved"
                  ].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timesheets.length === 0 && (
                  <tr><td colSpan={15} className="text-center py-16 text-gray-600 italic">No timesheets logged yet.</td></tr>
                )}
                {timesheets.map((t, i) => {
                  const rate = t.hourlyRate || t.employee.payRate || 0;
                  const pay = t.totalPay || (t.totalHours * rate);
                  return (
                    <tr key={t.id} className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors ${i % 2 === 0 ? "" : "bg-gray-900/10"}`}>
                      <td className="px-5 py-4 font-mono text-[10px] text-gray-500">{t.id.slice(0, 10)}…</td>
                      <td className="px-5 py-4 font-bold text-white whitespace-nowrap">{t.employee.name || "—"}</td>
                      <td className="px-5 py-4 font-mono text-[10px] text-gray-600">{t.employeeId.slice(0, 8)}…</td>
                      <td className="px-5 py-4 font-mono text-[10px] text-gray-600">{t.jobId.slice(0, 8)}…</td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{t.job.customerName || t.job.title || "—"}</span>
                          {t.job.isDisabled && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-[8px] text-emerald-400 font-black uppercase tracking-widest rounded-full">Finalized</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-gray-400">{t.startTime}</td>
                      <td className="px-5 py-4 text-gray-400">{t.endTime}</td>
                      <td className="px-5 py-4 font-bold text-white">{t.totalHours.toFixed(2)}</td>
                      <td className="px-5 py-4 text-gray-400">${rate.toFixed(2)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-400">${pay.toFixed(2)}</td>
                      <td className="px-5 py-4 text-gray-400 max-w-[200px] truncate">{t.tasksCompleted || "—"}</td>
                      <td className="px-5 py-4 text-gray-400 max-w-[150px] truncate">{t.materialsUsed || "—"}</td>
                      <td className="px-5 py-4 text-gray-500 text-[11px] whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {t.status === "APPROVED"
                          ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          : <AlertCircle className="w-4 h-4 text-yellow-500" />
                        }
                      </td>
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
