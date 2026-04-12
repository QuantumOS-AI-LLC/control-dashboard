"use client";

import React, { useState } from "react";
import { 
  X, 
  Plus, 
  User, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { createManualJob } from "@/app/actions/job";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    address: "",
    customerPhone: "",
    dispatchNotes: "",
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: "08:00"
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createManualJob({
        ...formData,
        scheduledDate: new Date(formData.scheduledDate)
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFormData({
            customerName: "",
            address: "",
            customerPhone: "",
            dispatchNotes: "",
            scheduledDate: new Date().toISOString().split('T')[0],
            scheduledTime: "08:00"
          });
          onClose();
        }, 2000);
      } else {
        setError(result.error || "Failed to create installation");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0F0F13]/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#14151A] border border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-indigo-600/20 p-2 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">New Deployment</h2>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-11">Manual Installation Workflow</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {success ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Deployment Scheduled</h3>
                <p className="text-gray-500 text-sm mt-2">The installation has been recorded and webhooks triggered.</p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Section: Customer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Customer Identity</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Full Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. John Wick"
                      value={formData.customerName}
                      onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                      <input 
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={formData.customerPhone}
                        onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Site Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Operational Theater</span>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Installation Address</label>
                  <input 
                    required
                    type="text"
                    placeholder="Physical address for deployment"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Deployment Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                      <input 
                        required
                        type="date"
                        value={formData.scheduledDate}
                        onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Target Time</label>
                    <div className="relative">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                      <input 
                        required
                        type="time"
                        value={formData.scheduledTime}
                        onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium [color-scheme:dark]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Dispatch Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Crew Instructions</span>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 italic">Notes, Gate Codes, or Site-Specific Warnings</label>
                   <textarea 
                    rows={3}
                    placeholder="e.g. Code 4592, Staging at back left corner..."
                    value={formData.dispatchNotes}
                    onChange={e => setFormData({ ...formData, dispatchNotes: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-gray-700 italic"
                  />
                </div>
              </div>
            </>
          )}

        </form>

        {/* Footer */}
        {!success && (
          <div className="p-8 border-t border-gray-800 flex justify-end gap-4 bg-black/20">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  Confirm Deployment
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
