import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, Phone, Mail, MapPin, Tag, Clock } from "lucide-react";
import ContactsHeader from "@/components/admin/ContactsHeader";

export const dynamic = 'force-dynamic';

export default async function ContactsPage() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") redirect("/");

  const contacts = await prisma.contact.findMany({ orderBy: { createdAt: "desc" } });

  const pipelineColors: Record<string, string> = {
    "Won": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "Lost": "bg-red-500/20 text-red-400 border-red-500/30",
    "Estimate Pending": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "New Lead": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  };

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <ContactsHeader totalContacts={contacts.length} />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Contacts", value: contacts.length, color: "indigo" },
            { label: "Won", value: contacts.filter(c => c.pipelineStage === "Won").length, color: "emerald" },
            { label: "Pending Estimate", value: contacts.filter(c => c.pipelineStage === "Estimate Pending").length, color: "yellow" },
            { label: "New Leads", value: contacts.filter(c => c.pipelineStage === "New Lead").length, color: "blue" },
          ].map(stat => (
            <div key={stat.label} className={`bg-[#14151A]/80 border border-gray-800 rounded-3xl p-6 text-center`}>
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
                  {["Contact ID", "Full Name", "Phone", "Email", "Pipeline Stage", "Lead Source", "City", "SMS Status", "Created"].map(h => (
                    <th key={h} className="px-5 py-4 text-left text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16 text-gray-600 italic">No contacts synced yet. Configure your GHL webhook to start populating this table.</td></tr>
                )}
                {contacts.map((c, i) => (
                  <tr key={c.id} className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors ${i % 2 === 0 ? "" : "bg-gray-900/10"}`}>
                    <td className="px-5 py-4 font-mono text-[10px] text-gray-500">{c.contactId.slice(0, 12)}…</td>
                    <td className="px-5 py-4 font-bold text-white whitespace-nowrap">{c.fullName || `${c.firstName || ""} ${c.lastName || ""}`.trim() || "—"}</td>
                    <td className="px-5 py-4 text-gray-400 whitespace-nowrap flex items-center gap-2"><Phone className="w-3 h-3 text-gray-600" />{c.phone || "—"}</td>
                    <td className="px-5 py-4 text-gray-400 whitespace-nowrap"><span className="flex items-center gap-2"><Mail className="w-3 h-3 text-gray-600" />{c.email || "—"}</span></td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase whitespace-nowrap ${pipelineColors[c.pipelineStage || ""] || "bg-gray-800 text-gray-500 border-gray-700"}`}>
                        {c.pipelineStage || "Unknown"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{c.leadSource || "—"}</td>
                    <td className="px-5 py-4 text-gray-400 whitespace-nowrap"><span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-600" />{c.city || "—"}</span></td>
                    <td className="px-5 py-4">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${c.smsResponseStatus === "Responded" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-800/50 text-gray-600"}`}>
                        {c.smsResponseStatus || "None"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-[11px] whitespace-nowrap"><span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(c.createdAt).toLocaleDateString()}</span></td>
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
