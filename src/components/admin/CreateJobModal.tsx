"use client";

import React, { useState, useEffect } from "react";
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
  AlertCircle,
  ChevronDown,
  Mail,
  Search,
  Users,
  HardHat
} from "lucide-react";
import { createManualJob, getBookedSlotsForDate, searchContactsByName, getDispatchUsers } from "@/app/actions/job";
import { useJobModalStore } from "@/store/jobModalStore";

const getTimeSlots = () => {
  const slots = [];
  for (let i = 7; i <= 18; i++) {
    const hour = i.toString().padStart(2, '0');
    slots.push(`${hour}:00`);
    slots.push(`${hour}:30`);
  }
  return slots;
};

const formatTimeLabel = (time: string) => {
  const [h, m] = time.split(':');
  let hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12; 
  return `${hour}:${m} ${ampm}`;
};

const TIME_SLOTS = getTimeSlots();

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { formData, setFormData, resetFormData, selectedContactId, setSelectedContactId } = useJobModalStore();

  const [contactResults, setContactResults] = useState<any[]>([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [searchingContacts, setSearchingContacts] = useState(false);
  const [dispatchUsers, setDispatchUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await getDispatchUsers();
      if (res.success) setDispatchUsers(res.users);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchContacts = async () => {
      if (!showContactDropdown || formData.customerName.length < 2 || selectedContactId) return;
      setSearchingContacts(true);
      const res = await searchContactsByName(formData.customerName);
      if (res.success) {
        setContactResults(res.contacts);
      }
      setSearchingContacts(false);
    };

    const delayDebounceFn = setTimeout(fetchContacts, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [formData.customerName, showContactDropdown, selectedContactId]);

  const [addressResults, setAddressResults] = useState<{display_name: string}[]>([]);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

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

  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!formData.scheduledDate) return;
      setFetchingSlots(true);
      const result = await getBookedSlotsForDate(formData.scheduledDate);
      if (result.success) {
        setBookedSlots(result.bookedSlots || []);
        // Optional: clear selected time if it's currently booked
        if (result.bookedSlots?.includes(formData.scheduledTime)) {
          setFormData({ scheduledTime: "" });
        }
      }
      setFetchingSlots(false);
    };
    fetchSlots();
  }, [formData.scheduledDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await createManualJob({
        ...formData,
        scheduledDate: new Date(formData.scheduledDate),
        selectedContactId: selectedContactId || undefined
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          resetFormData();
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
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Full Name</label>
                    <div className="relative">
                      <input 
                        required
                        type="text"
                        placeholder="e.g. John Wick"
                        value={formData.customerName}
                        onChange={e => {
                          setFormData({ customerName: e.target.value });
                          setSelectedContactId(null);
                          setShowContactDropdown(true);
                        }}
                        onFocus={() => setShowContactDropdown(true)}
                        onBlur={() => setTimeout(() => setShowContactDropdown(false), 200)}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 pl-12 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700"
                      />
                      <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                      {searchingContacts && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />}
                    </div>
                    {showContactDropdown && formData.customerName.length >= 2 && !selectedContactId && (
                      <div className="absolute top-full left-0 mt-2 w-full bg-[#14151A] border border-gray-800 rounded-2xl overflow-hidden z-[9999] shadow-2xl">
                        {contactResults.map((contact) => (
                          <div 
                            key={contact.id}
                            className="px-5 py-4 hover:bg-indigo-500/10 cursor-pointer border-b border-gray-800 last:border-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({
                                customerName: contact.fullName || "",
                                customerEmail: contact.email || "",
                                customerPhone: contact.phone || "",
                                address: contact.address || formData.address
                              });
                              setSelectedContactId(contact.id);
                              setShowContactDropdown(false);
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white">{contact.fullName}</span>
                              <span className="text-xs text-gray-500">{contact.email || contact.phone || "No contact info"}</span>
                            </div>
                          </div>
                        ))}
                        <div 
                          className="px-5 py-4 hover:bg-emerald-500/10 cursor-pointer text-sm text-emerald-400 font-bold transition-colors flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setShowContactDropdown(false);
                            // Keep written name, but it will be a new contact since selectedContactId remains null
                          }}
                        >
                          <Plus className="w-4 h-4" />
                          Add new contact: "{formData.customerName}"
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                      <input 
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formData.customerEmail}
                        onChange={e => setFormData({ customerEmail: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Contact Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700" />
                      <input 
                        required
                        type="tel"
                        placeholder="(555) 000-0000"
                        value={formData.customerPhone}
                        onChange={e => setFormData({ customerPhone: e.target.value })}
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
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Installation Address</label>
                  <input 
                    required
                    type="text"
                    placeholder="Physical address for deployment"
                    value={formData.address}
                    onChange={e => {
                      setFormData({ address: e.target.value });
                      setShowAddressDropdown(true);
                    }}
                    onFocus={() => setShowAddressDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAddressDropdown(false), 200)}
                    className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all font-medium placeholder:text-gray-700"
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Deployment Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                      <input 
                        required
                        type="date"
                        value={formData.scheduledDate}
                        onChange={e => setFormData({ scheduledDate: e.target.value })}
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Target Time (GHL Slots)</label>
                    <div className="relative">
                      <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none z-10" />
                      <select 
                        required
                        value={formData.scheduledTime}
                        onChange={e => setFormData({ scheduledTime: e.target.value })}
                        disabled={fetchingSlots}
                        className="w-full relative appearance-none bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-12 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium [color-scheme:dark] cursor-pointer disabled:opacity-50"
                      >
                        <option value="" disabled>Select Time</option>
                        {TIME_SLOTS.map(time => {
                          const isBooked = bookedSlots.includes(time);
                          return (
                            <option key={time} value={time} disabled={isBooked} className={isBooked ? 'text-gray-500' : ''}>
                              {formatTimeLabel(time)} {isBooked ? '(Booked)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Assigned Foreman (Required)</label>
                    <div className="relative">
                      <HardHat className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none z-10" />
                      <select 
                        required
                        value={formData.foremanId}
                        onChange={e => setFormData({ foremanId: e.target.value })}
                        className="w-full relative appearance-none bg-emerald-500/10 border border-emerald-500/20 rounded-2xl pl-12 pr-12 py-4 text-emerald-50 focus:outline-none focus:border-emerald-500 transition-all font-medium [color-scheme:dark] cursor-pointer"
                      >
                        <option value="" disabled>Select Foreman</option>
                        {dispatchUsers.filter(u => ['ADMIN', 'MANAGER', 'FOREMAN'].includes(u.role)).map(user => (
                          <option key={user.id} value={user.id} className="bg-gray-900 text-white">
                            {user.name} ({user.role})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Crew Members (Optional)</label>
                    <div className="relative">
                      <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none z-10" />
                      <div className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-12 pr-4 py-4 text-white font-medium max-h-32 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                        {dispatchUsers.map(user => {
                          const isSelected = formData.crewIds.includes(user.id);
                          return (
                            <label key={user.id} className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) setFormData({ crewIds: [...formData.crewIds, user.id] });
                                  else setFormData({ crewIds: formData.crewIds.filter(id => id !== user.id) });
                                }}
                                className="w-4 h-4 rounded border-gray-700 text-indigo-600 focus:ring-indigo-500 bg-gray-800 cursor-pointer"
                              />
                              <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{user.name}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 italic">Notes, Gate Codes, or Site-Specific Warnings</label>
                   <textarea 
                    required
                    rows={3}
                    placeholder="e.g. Code 4592, Staging at back left corner..."
                    value={formData.dispatchNotes}
                    onChange={e => setFormData({ dispatchNotes: e.target.value })}
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
              className="px-6 py-3 text-gray-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={loading || !formData.foremanId}
              className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
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
