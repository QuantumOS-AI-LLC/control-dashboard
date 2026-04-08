import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Package, DollarSign, Truck, CheckCircle2, Clock } from "lucide-react";

export default async function MaterialsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const materials = await prisma.material.findMany({
    orderBy: { createdAt: "desc" },
    include: { job: { select: { customerName: true, title: true } } }
  });

  const totalCost = materials.reduce((sum, m) => sum + (m.totalCost || 0), 0);
  const pending = materials.filter(m => m.status === "Pending" || !m.status).length;
  const received = materials.filter(m => m.status === "Received").length;

  const statusColors: Record<string, string> = {
    "Ordered": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Received": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Pending": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Cancelled": "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="bg-amber-600/20 p-3 rounded-2xl border border-amber-500/30">
            <Package className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">Material Lists</h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold mt-1">{materials.length} line items tracked</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Line Items", value: materials.length, icon: Package, color: "amber" },
            { label: "Total Cost", value: `$${totalCost.toFixed(2)}`, icon: DollarSign, color: "emerald" },
            { label: "Received", value: received, icon: CheckCircle2, color: "emerald" },
            { label: "Pending / Ordered", value: pending, icon: Truck, color: "yellow" },
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
                  {["Item Name", "Job", "Qty", "Unit", "Cost/Unit", "Total Cost", "Supplier", "Status", "Ordered", "Received"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-16 text-gray-600 italic">No materials logged yet.</td></tr>
                )}
                {materials.map((m, i) => (
                  <tr key={m.id} className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors ${i % 2 === 0 ? "" : "bg-gray-900/10"}`}>
                    <td className="px-5 py-4 font-bold text-white whitespace-nowrap">{m.itemName || "—"}</td>
                    <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{m.job.customerName || m.job.title || "—"}</td>
                    <td className="px-5 py-4 text-gray-400">{m.quantity ?? "—"}</td>
                    <td className="px-5 py-4 text-gray-400">{m.unit || "—"}</td>
                    <td className="px-5 py-4 text-gray-400">${(m.costPerUnit || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 font-bold text-emerald-400">${(m.totalCost || 0).toFixed(2)}</td>
                    <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{m.supplier || "—"}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase whitespace-nowrap ${statusColors[m.status || ""] || "bg-gray-800 text-gray-500 border-gray-700"}`}>
                        {m.status || "Pending"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-[11px] whitespace-nowrap">{m.orderedDate ? new Date(m.orderedDate).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-4 text-gray-500 text-[11px] whitespace-nowrap">{m.receivedDate ? new Date(m.receivedDate).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
