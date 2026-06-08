"use client";
import React, { useState } from "react";
import { CheckCircle2, Clock, MapPin, Upload, Star, AlertCircle, FileText, Calendar, Camera, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  address: string | null;
  status?: string;
};

export default function EmployeeCompletionForm({ 
  availableJobs, 
  initialJobId,
  jobStatus
}: { 
  availableJobs: Job[]; 
  initialJobId?: string;
  jobStatus?: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    jobId: initialJobId || "",
    completionDate: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    finalMaterialsUsed: "",
    issuesEncountered: "",
    customerSatisfactionScore: 5,
    completionNotes: "",
  });

  const [diggingFormData, setDiggingFormData] = useState({
    diggingHours: "",
    hardDiggingHoles: "0",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageBase64s, setImageBase64s] = useState<string[]>([]);

  const selectedJob = availableJobs.find(j => j.id === formData.jobId);
  const currentStatus = selectedJob?.status || jobStatus;
  const isDigging = currentStatus === "Digging_In_Progress";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    if (isDigging) {
      if (!diggingFormData.diggingHours || parseFloat(diggingFormData.diggingHours) <= 0) {
        setMessage({ type: 'error', text: "Please provide valid digging hours." });
        setIsSubmitting(false);
        return;
      }
      if (imageFiles.length === 0) {
        setMessage({ type: 'error', text: "At least one digging photo is required for site verification." });
        setIsSubmitting(false);
        return;
      }

      try {
        const res = await fetch("/api/timesheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: formData.jobId,
            date: new Date().toISOString().split('T')[0],
            isDiggingComplete: true,
            diggingHours: parseFloat(diggingFormData.diggingHours) || 0,
            hardDiggingHoles: parseInt(diggingFormData.hardDiggingHoles) || 0,
            diggingPhotos: imageBase64s
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to submit digging report");
        }
        setMessage({ type: 'success', text: "Digging report successfully submitted and stage updated!" });
        setTimeout(() => router.push("/employee/dashboard"), 2000);
      } catch (e: any) {
        setMessage({ type: 'error', text: e.message || "Error submitting digging report. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Standard Final Close-out Form Submit
    if ((formData.startTime && !formData.endTime) || (!formData.startTime && formData.endTime)) {
      setMessage({ type: 'error', text: "Please provide both start and end times if logging final hours." });
      setIsSubmitting(false);
      return;
    }

    if (imageFiles.length === 0) {
      setMessage({ type: 'error', text: "At least one completion photo is required." });
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
          completionImages: imageBase64s,
          date: formData.completionDate,
          startTime: formData.startTime || "00:00",
          endTime: formData.endTime || "00:00",
          tasksCompleted: "FINAL JOB COMPLETION REPORT",
          materialsUsed: formData.finalMaterialsUsed
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to submit");
      }
      setMessage({ type: 'success', text: "Job successfully finalized and closed!" });
      setTimeout(() => router.push("/employee/dashboard"), 2000);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || "Error finalizing job. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const totalCount = imageFiles.length + newFiles.length;
      
      if (totalCount > 5) {
        alert("Maximum 5 images allowed.");
        return;
      }

      setImageFiles(prev => [...prev, ...newFiles]);

      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageBase64s(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageBase64s(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`max-w-2xl mx-auto p-8 bg-[#14151A]/90 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] border relative overflow-hidden font-sans transition-all ${
      isDigging ? 'border-amber-500/20' : 'border-emerald-500/20'
    }`}>
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-transparent to-transparent ${
        isDigging ? 'via-amber-500/40' : 'via-emerald-500/40'
      }`}></div>

      <div className={`mb-8 flex items-center gap-4 p-6 rounded-3xl border ${
        isDigging ? 'bg-amber-500/5 border-amber-500/10' : 'bg-emerald-500/5 border-emerald-500/10'
      }`}>
        <div className={`p-3 rounded-2xl border shadow-lg ${
          isDigging 
            ? 'bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-amber-500/10' 
            : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
        }`}>
          {isDigging ? <Clock className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isDigging ? "Digging Report" : "Job Completion"}
          </h2>
          <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
            isDigging ? 'text-amber-500/70' : 'text-emerald-500/70'
          }`}>
            {isDigging ? "Official Digging Phase Close-Out" : "Official Site Close-Out Report"}
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-2xl text-sm font-bold border flex items-center justify-center shadow-lg transition-all animate-in fade-in slide-in-from-top-2 ${
          message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div>
            <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Select Installation to Close</label>
            <select
              required
              className={`w-full px-5 py-4 border rounded-2xl bg-[#0A0A0B] text-white outline-none transition-all appearance-none shadow-inner ${
                isDigging ? 'focus:ring-2 focus:ring-amber-500 border-gray-800' : 'focus:ring-2 focus:ring-emerald-500 border-gray-800'
              }`}
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            >
              <option value="" disabled>Choose the finished job</option>
              {availableJobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
          </div>

          {isDigging ? (
            /* =========================================================================
               DIGGING REPORT FORM FIELDS
               ========================================================================= */
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Digging Time (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    placeholder="e.g. 4.5"
                    className="w-full px-5 py-4 border rounded-2xl focus:ring-2 focus:ring-amber-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all"
                    value={diggingFormData.diggingHours}
                    onChange={(e) => setDiggingFormData({ ...diggingFormData, diggingHours: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Hard Digging Holes</label>
                  <input
                    type="number"
                    min="0"
                    required
                    className="w-full px-5 py-4 border rounded-2xl focus:ring-2 focus:ring-amber-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all"
                    value={diggingFormData.hardDiggingHoles}
                    onChange={(e) => setDiggingFormData({ ...diggingFormData, hardDiggingHoles: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Site Verification (Max 5 Photos)</label>
                <div className={`mt-1 p-6 border-2 border-dashed rounded-[2rem] transition-all relative group ${
                  imageFiles.length > 0 ? "bg-amber-500/5 border-amber-500/50" : "bg-[#0A0A0B] border-gray-800 hover:border-amber-500/30"
                }`}>
                  {imageBase64s.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      {imageBase64s.map((base64, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-amber-500/20 shadow-lg group/img">
                          <img src={base64} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                          >
                            <AlertCircle className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                      ))}
                      {imageFiles.length < 5 && (
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl hover:border-amber-500/30 cursor-pointer transition-all">
                          <Plus className="w-6 h-6 text-gray-600" />
                          <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple />
                        </label>
                      )}
                    </div>
                  )}
                  
                  {imageFiles.length === 0 && (
                    <div className="flex flex-col items-center py-6">
                      <Upload className="h-10 w-10 mb-4 text-gray-600 group-hover:text-amber-500 transition-colors" />
                      <label className="cursor-pointer">
                        <span className="px-6 py-2.5 bg-amber-600/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-sm hover:bg-amber-600/30 transition-all block text-center">
                          Upload Site Pictures
                        </span>
                        <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple />
                      </label>
                    </div>
                  )}

                  {imageFiles.length > 0 && (
                    <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-widest text-center">
                      {imageFiles.length} of 5 images uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* =========================================================================
               STANDARD JOB COMPLETION FORM FIELDS
               ========================================================================= */
            <div className="space-y-6 animate-in fade-in duration-300">
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
                  <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Final Shift Log (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      className="w-full px-4 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark] text-xs"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      placeholder="Start"
                    />
                    <span className="text-gray-700">to</span>
                    <input
                      type="time"
                      className="w-full px-4 py-4 border rounded-2xl focus:ring-2 focus:ring-emerald-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark] text-xs"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      placeholder="End"
                    />
                  </div>
                </div>
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
                <label className="block text-gray-500 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Site Finish Verification (Max 5 Photos)</label>
                <div className={`mt-1 p-6 border-2 border-dashed rounded-[2rem] transition-all relative group ${
                  imageFiles.length > 0 ? "bg-emerald-500/5 border-emerald-500/50" : "bg-[#0A0A0B] border-gray-800 hover:border-emerald-500/30"
                }`}>
                  {imageBase64s.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                      {imageBase64s.map((base64, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg group/img">
                          <img src={base64} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg"
                          >
                            <AlertCircle className="w-4 h-4 rotate-45" />
                          </button>
                        </div>
                      ))}
                      {imageFiles.length < 5 && (
                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl hover:border-emerald-500/30 cursor-pointer transition-all">
                          <Plus className="w-6 h-6 text-gray-600" />
                          <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple />
                        </label>
                      )}
                    </div>
                  )}
                  
                  {imageFiles.length === 0 && (
                    <div className="flex flex-col items-center py-6">
                      <Upload className="h-10 w-10 mb-4 text-gray-600 group-hover:text-emerald-500 transition-colors" />
                      <label className="cursor-pointer">
                        <span className="px-6 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-sm hover:bg-emerald-600/30 transition-all block text-center">
                          Upload Completion Photos
                        </span>
                        <input type="file" className="sr-only" onChange={handleImageChange} accept="image/*" multiple />
                      </label>
                    </div>
                  )}

                  {imageFiles.length > 0 && (
                    <p className="text-[10px] text-gray-600 mt-2 uppercase font-bold tracking-widest text-center">
                      {imageFiles.length} of 5 images uploaded
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-5 px-6 border-none rounded-[1.5rem] text-xl font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.1em] shadow-2xl ${
            isDigging 
              ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 shadow-amber-500/20' 
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
          }`}
        >
          {isSubmitting 
            ? (isDigging ? "Submitting Digging..." : "Finalizing Close-Out...") 
            : (isDigging ? "Submit Digging Report & Complete Phase" : "Initialize Job Closure")}
        </button>
      </form>
    </div>
  );
}
