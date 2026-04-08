"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Upload, Star, AlertCircle, FileText, Calendar, Camera } from "lucide-react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  address: string;
};

export default function EmployeeCompletionForm({ availableJobs, initialJobId }: { availableJobs: Job[], initialJobId?: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    jobId: initialJobId || "",
    completionDate: new Date().toISOString().split('T')[0],
    finalMaterialsUsed: "",
    issuesEncountered: "",
    customerSatisfactionScore: 5,
    completionNotes: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (!imageFile) {
        setMessage({ type: 'error', text: "A completion photo is required." });
        setIsSubmitting(false);
        return;
    }

    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
           ...formData,
           isCompleted: true,
           completionImage: imageBase64,
           // Send a dummy timesheet record to satisfy the DB schema if needed
           // OR I can update the API to handle completion-only submissions.
           // For now, I'll send 0 hours so it doesn't mess with payroll.
           date: formData.completionDate,
           startTime: "00:00",
           endTime: "00:00",
           tasksCompleted: "FINAL JOB COMPLETION REPORT",
           materialsUsed: formData.finalMaterialsUsed
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setMessage({ type: 'success', text: "Job successfully finalized and closed!" });
      setTimeout(() => router.push("/employee/dashboard"), 2000);
    } catch (e) {
      setMessage({ type: 'error', text: "Error finalizing job. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setImageBase64(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-[#14151A]/90 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>

      <div className="mb-8 flex items-center gap-4 bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10">
        <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Job Completion</h2>
          <p className="text-[10px] text-emerald-500/70 uppercase tracking-[0.2em] font-bold">Official Site Close-Out Report</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-2xl text-sm font-bold border flex items-center justify-center shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Select Installation to Close</label>
            <select
              required
              className="w-full px-5 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all appearance-none shadow-inner"
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            >
              <option value="" disabled>Choose the finished job</option>
              {availableJobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Actual Completion Date</label>
              <input
                type="date"
                required
                className="w-full px-5 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark]"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Client Satisfaction</label>
              <div className="flex items-center justify-between bg-[#0A0A0B] px-6 py-4 border rounded-2xl border-gray-800 shadow-inner">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} type="button" onClick={() => setFormData({ ...formData, customerSatisfactionScore: s })} className="transition-transform active:scale-90">
                    <Star className={`w-6 h-6 transition-all ${formData.customerSatisfactionScore >= s ? 'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'text-gray-800'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
             <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Final Material Reconciliation</label>
             <textarea
              required
              className="w-full p-5 border rounded-2xl focus:ring-2 focus:ring-emerald-500 bg-[#0A0A0B] border-gray-800 text-white outline-none min-h-[100px] resize-none placeholder:text-gray-700 shadow-inner"
              placeholder="Final count of posts, panels, etc..."
              value={formData.finalMaterialsUsed}
              onChange={(e) => setFormData({ ...formData, finalMaterialsUsed: e.target.value })}
            />
          </div>

          <div>
             <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest leading-tight">
               <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Site Issues or Unforeseen Obstacles
             </label>
             <textarea
              className="w-full p-5 border rounded-2xl focus:ring-2 focus:ring-emerald-500 bg-[#0A0A0B] border-gray-800 text-white outline-none min-h-[80px] resize-none placeholder:text-gray-700 shadow-inner"
              placeholder="Report any terrain details or hardware delays..."
              value={formData.issuesEncountered}
              onChange={(e) => setFormData({ ...formData, issuesEncountered: e.target.value })}
            />
          </div>

          <div>
             <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Site Finish Verification Photo</label>
            <div className={`mt-1 flex flex-col justify-center items-center p-10 border-2 border-dashed rounded-[2rem] transition-all relative group ${imageFile ? "bg-emerald-500/5 border-emerald-500/50" : "bg-[#0A0A0B] border-gray-800 hover:border-emerald-500/30"}`}>
              {imageBase64 ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 border border-emerald-500/20 shadow-2xl">
                   <img src={imageBase64} alt="Preview" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
                   </div>
                </div>
              ) : (
                <Upload className="h-10 w-10 mb-4 text-gray-600 group-hover:text-emerald-500 transition-colors" />
              )}
              
              <label className="cursor-pointer">
                <span className="px-6 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm hover:bg-emerald-600/30 transition-all block">
                   {imageFile ? "Change Photo" : "Upload Verification Photo"}
                </span>
                <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" required />
              </label>
              <p className="text-[10px] text-gray-600 mt-4 uppercase font-bold tracking-widest">
                {imageFile ? imageFile.name : 'JPEG or PNG (REQUIRED)'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-5 px-6 border-none rounded-[1.5rem] shadow-[0_20px_50px_rgba(16,185,129,0.2)] text-xl font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.1em]"
        >
          {isSubmitting ? "Finalizing..." : "Initialize Job Closure"}
        </button>
      </form>
    </div>
  );
}
