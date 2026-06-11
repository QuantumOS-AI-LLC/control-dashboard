"use client";

import React, { useState } from "react";
import { CheckCircle2, Clipboard, Shield, Layers, HelpCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { completeEstimateVisit } from "@/app/actions/job";

type Job = {
  id: string;
  title: string;
  address: string | null;
};

const FENCE_OPTIONS = ["Wood", "Ornemental", "Frost", "Composit", "Glass"];
const INSTALLATION_OPTIONS = ["In ground", "On concrete", "Both"];
const ACCESS_OPTIONS = ["Skid access", "Excavator access", "Manual dig only"];

export default function EmployeeEstimateForm({ job }: { job: Job }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [fenceTypes, setFenceTypes] = useState<string[]>([]);
  const [installationType, setInstallationType] = useState<string>("");
  const [frostPrivacySlats, setFrostPrivacySlats] = useState<boolean | null>(null);
  const [accessLimitations, setAccessLimitations] = useState<string>("");
  const [bringBackDirt, setBringBackDirt] = useState<boolean | null>(null);
  const [notes, setNotes] = useState<string>("");

  const handleFenceTypeToggle = (type: string) => {
    setFenceTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    /* HIDE FOR NOW - CAN BE RE-ENABLED LATER
    if (fenceTypes.length === 0) {
      setMessage({ type: 'error', text: "Please select at least one fence type." });
      return;
    }
    if (!installationType) {
      setMessage({ type: 'error', text: "Please select an installation type." });
      return;
    }
    */
    if (frostPrivacySlats === null) {
      setMessage({ type: 'error', text: "Please specify if we install privacy slats." });
      return;
    }
    if (!accessLimitations) {
      setMessage({ type: 'error', text: "Please select access limitations." });
      return;
    }
    if (bringBackDirt === null) {
      setMessage({ type: 'error', text: "Please select whether to bring back dirt." });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await completeEstimateVisit(job.id, {
        // fenceTypes, // Hidden for now
        // installationType, // Hidden for now
        accessLimitations,
        bringBackDirt: bringBackDirt,
        notes,
        frostPrivacySlats
      });

      if (result.success) {
        setMessage({ type: 'success', text: "Estimate successfully completed and saved!" });
        setTimeout(() => {
          router.push("/employee/dashboard");
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || "Failed to submit estimate details." });
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "An unexpected error occurred." });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-[#14151A]/90 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] border border-indigo-500/20 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>

      <div className="mb-8 flex items-center gap-4 p-6 rounded-3xl border bg-indigo-500/5 border-indigo-500/10">
        <div className="p-3 rounded-2xl border bg-indigo-500/20 border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-500/10">
          <Clipboard className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Estimate Spec Confirmation</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-indigo-400/70">
            Confirm Fencing Parameters & Logistics
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
          {/* Confirmed Fence Types - Hidden for now, can be re-enabled later */}
          {/* 
          <div>
            <label className="block text-gray-400 font-black mb-3 ml-1 uppercase text-[10px] tracking-[0.2em]">Confirmed Fence Types</label>
            <div className="flex flex-wrap gap-2.5">
              {FENCE_OPTIONS.map((type) => {
                const isSelected = fenceTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFenceTypeToggle(type)}
                    className={`px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                        : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
          */}

          {/* Installation Method - Hidden for now, can be re-enabled later */}
          {/* 
          <div>
            <label className="block text-gray-400 font-black mb-3 ml-1 uppercase text-[10px] tracking-[0.2em]">Installation Method</label>
            <div className="grid grid-cols-3 gap-3">
              {INSTALLATION_OPTIONS.map((opt) => {
                const isSelected = installationType === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setInstallationType(opt)}
                    className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                        : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
          */}

          {/* Access Limitations */}
          <div>
            <label className="block text-gray-400 font-black mb-3 ml-1 uppercase text-[10px] tracking-[0.2em]">Logistics & Site Access</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ACCESS_OPTIONS.map((opt) => {
                const isSelected = accessLimitations === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAccessLimitations(opt)}
                    className={`py-4 px-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                        : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Do we install privacy slats */}
          <div>
            <label className="block text-gray-400 font-black mb-3 ml-1 uppercase text-[10px] tracking-[0.2em]">Do we install privacy slats?</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFrostPrivacySlats(true)}
                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  frostPrivacySlats === true
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                    : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFrostPrivacySlats(false)}
                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  frostPrivacySlats === false
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                    : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Bring Back Dirt */}
          <div>
            <label className="block text-gray-400 font-black mb-3 ml-1 uppercase text-[10px] tracking-[0.2em]">Dirt Removal (Bring Back Dirt)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBringBackDirt(true)}
                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  bringBackDirt === true
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                    : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                Yes (Bring Back)
              </button>
              <button
                type="button"
                onClick={() => setBringBackDirt(false)}
                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  bringBackDirt === false
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_4px_20px_rgba(79,70,229,0.3)] scale-[1.02]"
                    : "bg-gray-900/40 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
                }`}
              >
                No (Spread on Site)
              </button>
            </div>
          </div>

          {/* Detailed Estimator Notes */}
          <div>
            <label className="block text-gray-400 font-black mb-2 ml-1 uppercase text-[10px] tracking-[0.2em]">Estimator Visit Notes / Special Instructions</label>
            <textarea
              rows={4}
              placeholder="Provide exact measurements, gate codes, or details to prepare the crew..."
              className="w-full px-5 py-4 border rounded-2xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-700 font-medium text-sm leading-relaxed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-3 py-4.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_10px_40px_rgba(79,70,229,0.25)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              Submitting Report...
            </>
          ) : (
            <>
              Confirm & Complete Estimate
              <ArrowRight className="w-4 h-4 text-white" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
