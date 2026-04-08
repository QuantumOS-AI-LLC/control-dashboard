"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, MapPin, Upload, Star, AlertCircle, FileText, Calendar } from "lucide-react";

type Job = {
  id: string;
  title: string;
  address: string;
};

export default function EmployeeTimesheetForm({ availableJobs, initialJobId }: { availableJobs: any[], initialJobId?: string }) {
  const router = useRouter();
  const [isOffline, setIsOffline] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [formData, setFormData] = useState({
    jobId: initialJobId || "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    tasksCompleted: "",
    materialsUsed: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  // Monitor network connection
  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncOfflineData(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOffline(!navigator.onLine);
    if (navigator.onLine) syncOfflineData();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncOfflineData = async () => {
    const cachedData = localStorage.getItem("offline_timesheets");
    if (!cachedData) return;
    try {
      const timesheets = JSON.parse(cachedData);
      await fetch("/api/timesheets/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheets }),
      });
      localStorage.removeItem("offline_timesheets");
      setMessage({ type: 'success', text: "Offline timesheets successfully synced!" });
    } catch (e) {
      console.error("Failed to sync offline timesheets", e);
    }
  };

  const handleTimesheetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      ...formData,
    };

    if (isOffline) {
      const cachedData = localStorage.getItem("offline_timesheets");
      const currentCache = cachedData ? JSON.parse(cachedData) : [];
      currentCache.push(payload);
      localStorage.setItem("offline_timesheets", JSON.stringify(currentCache));
      setMessage({ type: 'success', text: "You are offline. Timesheet saved locally." });
      setIsSubmitting(false);
      resetForm();
      return;
    }

    try {
      const res = await fetch("/api/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit");
      setMessage({ type: 'success', text: "Timesheet submitted successfully!" });
      setTimeout(() => router.push("/employee/dashboard"), 1500);
    } catch (e) {
      setMessage({ type: 'error', text: "Error submitting timesheet. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ jobId: "", date: new Date().toISOString().split('T')[0], startTime: "", endTime: "", tasksCompleted: "", materialsUsed: "" });
    setImageFile(null);
    setImageBase64(null);
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
    <div className="max-w-2xl mx-auto p-8 bg-[#14151A]/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-gray-800 relative overflow-hidden font-sans">
       <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      <div className="mb-6 flex justify-between items-center bg-[#0A0A0B]/50 p-4 rounded-xl border border-gray-800">
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2 m-0 tracking-tight">
          <Clock className="w-6 h-6 text-indigo-500" />
          Acme Fence Daily Timesheet
        </h2>
        {isOffline ? (
          <div className="bg-red-500/10 text-red-500 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-red-500/20 font-bold uppercase transition-all animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600"></span> Offline Access
          </div>
        ) : (
          <div className="bg-emerald-500/10 text-emerald-500 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 border border-emerald-500/20 font-bold uppercase transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Sync Active
          </div>
        )}
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm font-semibold border flex items-center justify-center shadow-lg transition-all ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleTimesheetSubmit} className="space-y-6 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <MapPin className="w-3 h-3 text-indigo-500" /> Job Selection
            </label>
            <select
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all appearance-none"
              value={formData.jobId}
              onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
            >
              <option value="" disabled className="bg-[#14151A]">Choose an active job</option>
              {availableJobs.map((job) => (
                <option key={job.id} value={job.id} className="bg-[#14151A]">{job.title} - {job.address}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <Calendar className="w-3 h-3 text-indigo-500" /> Reporting Date
            </label>
            <input
              type="date"
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark]"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <Clock className="w-3 h-3 text-emerald-500" /> Shift Start
            </label>
            <input
              type="time"
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark]"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest">
              <Clock className="w-3 h-3 text-red-500" /> Shift End
            </label>
            <input
              type="time"
              required
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark]"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest">
            <FileText className="w-3 h-3 text-indigo-500" /> Tasks Log
          </label>
          <textarea
            required
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all min-h-[100px] resize-none placeholder:text-gray-600"
            placeholder="Detailed list of work performed..."
            value={formData.tasksCompleted}
            onChange={(e) => setFormData({ ...formData, tasksCompleted: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-gray-400 font-bold mb-1.5 ml-1 flex items-center gap-2 uppercase text-[10px] tracking-widest">
            <AlertCircle className="w-3 h-3 text-amber-500" /> Materials Used
          </label>
          <textarea
            className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all min-h-[80px] resize-none placeholder:text-gray-600"
            placeholder="List posts, brackets, panels, etc... "
            value={formData.materialsUsed}
            onChange={(e) => setFormData({ ...formData, materialsUsed: e.target.value })}
          />
        </div>


        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center py-5 px-6 border-none rounded-3xl shadow-[0_0_40px_rgba(79,70,229,0.2)] text-xl font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-10"
        >
          {isSubmitting ? "Syncing..." : (isOffline ? "Store Locally" : "LOG DAILY PROGRESS")}
        </button>
      </form>
    </div>
  );
}
