"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Tag
} from "lucide-react";
import { createManualContact } from "@/app/actions/contact";
import { searchContactsByName } from "@/app/actions/job";

interface CreateContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateContactModal({ isOpen, onClose }: CreateContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    pipelineStage: "New Lead"
  });

  // Search/Autocomplete states
  const [contactResults, setContactResults] = useState<any[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [searchingContacts, setSearchingContacts] = useState(false);

  const [addressResults, setAddressResults] = useState<{display_name: string}[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Address Autocomplete Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (showAddressDropdown && formData.address.length > 5) {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&addressdetails=1&limit=5`);
          const data = await res.json();
          setAddressResults(data);
        } catch (err) {
          console.error(err);
        }
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.address, showAddressDropdown]);

  // Contact Deduplication Check Logic
  useEffect(() => {
    const fetchContacts = async () => {
      if (!showContactDropdown || formData.fullName.length < 2) return;
      setSearchingContacts(true);
      const res = await searchContactsByName(formData.fullName);
      if (res.success) {
        setContactResults(res.contacts);
      }
      setSearchingContacts(false);
    };

    const delayDebounceFn = setTimeout(fetchContacts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.fullName, showContactDropdown]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createManualContact(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setFormData({
            fullName: "",
            email: "",
            phone: "",
            address: "",
            pipelineStage: "New Lead"
          });
          onClose();
        }, 2000);
      } else {
        setError(result.error || "Failed to create contact");
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
      <div className="relative w-full max-w-xl bg-[#14151A] border border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-indigo-600/20 p-2 rounded-xl text-indigo-400 border border-indigo-500/20">
                <Plus className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Manual Contact Intake</h2>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold ml-11">Sync to GoHighLevel Ecosystem</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          {success ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Synchronization Initialized</h3>
                <p className="text-gray-500 text-sm mt-2">The contact has been recorded. n8n will process the CRM sync shortly.</p>
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

              {/* Name Field with Search/Deduplication */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                  <User className="w-3 h-3" /> Full Name
                </label>
                <div className="relative">
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Thomas Shelby"
                    value={formData.fullName}
                    onChange={e => {
                      setFormData({ ...formData, fullName: e.target.value });
                      setShowContactDropdown(true);
                    }}
                    onFocus={() => setShowContactDropdown(true)}
                    onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 pl-12 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700"
                  />
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                  {searchingContacts && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
                </div>

                {showContactDropdown && contactResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-[#14151A] border border-gray-800 rounded-2xl overflow-hidden z-[9999] shadow-2xl">
                    <div className="px-5 py-2 bg-indigo-500/10 border-b border-gray-800 text-[9px] font-black text-indigo-400 uppercase tracking-widest">Similar Records Found (Deduplication)</div>
                    {contactResults.map((contact) => (
                      <div 
                        key={contact.id}
                        className="px-5 py-4 hover:bg-indigo-500/10 cursor-pointer border-b border-gray-800 last:border-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({
                            fullName: contact.fullName || "",
                            email: contact.email || "",
                            phone: contact.phone || "",
                            address: contact.address || formData.address,
                            pipelineStage: formData.pipelineStage
                          });
                          setShowContactDropdown(false);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white">{contact.fullName}</span>
                            <span className="text-xs text-gray-500">{contact.email || contact.phone || "No details"}</span>
                          </div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase">Use Existing</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <input 
                    required
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-gray-700"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Phone
                  </label>
                  <input 
                    required
                    type="tel"
                    placeholder="(555) 000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-gray-700 font-mono"
                  />
                </div>
              </div>

              {/* Address with Autocomplete */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> Physical Address
                </label>
                <input 
                  required
                  type="text"
                  placeholder="Street, City, State, Zip"
                  value={formData.address}
                  onChange={e => {
                    setFormData({ ...formData, address: e.target.value });
                    setShowAddressDropdown(true);
                  }}
                  onFocus={() => setShowAddressDropdown(true)}
                  onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-gray-700"
                />
                
                {showAddressDropdown && addressResults.length > 0 && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-[#14151A] border border-gray-800 rounded-2xl overflow-hidden z-[9999] shadow-2xl">
                    {addressResults.map((result, idx) => (
                      <div 
                        key={idx}
                        className="px-5 py-4 hover:bg-indigo-500/10 cursor-pointer text-sm text-gray-300 border-b border-gray-800 last:border-0 transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({ ...formData, address: result.display_name });
                          setShowAddressDropdown(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-indigo-500/50 shrink-0" />
                          <span className="line-clamp-2">{result.display_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-2">
                  <Tag className="w-3 h-3" /> Pipeline Stage
                </label>
                <select 
                  value={formData.pipelineStage}
                  onChange={e => setFormData({ ...formData, pipelineStage: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="New Lead" className="bg-[#14151A]">New Lead</option>
                  <option value="Estimate Pending" className="bg-[#14151A]">Estimate Pending</option>
                  <option value="Won" className="bg-[#14151A]">Won</option>
                  <option value="Lost" className="bg-[#14151A]">Lost</option>
                </select>
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
              className="px-6 py-3 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  Initialize GHL Sync
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
