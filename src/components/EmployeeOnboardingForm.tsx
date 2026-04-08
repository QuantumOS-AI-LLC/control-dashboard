"use client";

import { useState } from "react";
import { UserPlus, Mail, Phone, Lock, UploadCloud, Calendar, DollarSign, UserCog } from "lucide-react";

const ROLES = ["CREW", "FOREMAN", "MANAGER", "ADMIN"];

export default function EmployeeOnboardingForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "CREW",
    payRate: "",
    hireDate: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const payload = {
      ...formData,
      payRate: parseFloat(formData.payRate),
      // hireDate will be parsed as a date on the server side
    };

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit onboarding form");
      
      setMessage({ type: 'success', text: "Onboarding completed! Welcome to the team." });
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        role: "CREW",
        payRate: "",
        hireDate: "",
        emergencyContactName: "",
        emergencyContactPhone: "",
        password: "",
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: "An error occurred during onboarding." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-[#14151A]/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-gray-800 mt-10 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <div className="bg-indigo-600/20 p-4 rounded-2xl mb-4 border border-indigo-500/30">
          <UserPlus className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Onboard New Personnel</h2>
        <p className="text-gray-400 mt-2">Welcome to the M.Clôture team! Please complete this form with your information.</p>
      </div>

      {message && (
        <div className={`p-4 mb-8 rounded-xl text-sm font-semibold border flex items-center justify-center ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">First Name</label>
            <input
              type="text"
              required
              placeholder="First Name"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Last Name</label>
            <input
              type="text"
              required
              placeholder="Last Name"
              className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="tel"
                required
                placeholder="Phone Number"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="email"
                required
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Access Role</label>
            <div className="relative">
              <UserCog className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <select
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl bg-[#0A0A0B] border-gray-800 text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                {ROLES.map(role => <option key={role} value={role} className="bg-[#14151A]">{role}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Hourly Pay Rate (CAD)</label>
            <div className="relative">
              <DollarSign className="absolute left-3.5 top-3.5 h-4 w-4 text-emerald-500" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
                value={formData.payRate}
                onChange={(e) => setFormData({ ...formData, payRate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Hire Date</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-indigo-500" />
              <input
                type="date"
                required
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all [color-scheme:dark]"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Log-in Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-2 mt-4 pt-6 border-t border-gray-800/50">
          <h3 className="text-md font-bold text-indigo-400 mb-4 uppercase tracking-widest text-xs">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Emergency Contact Name</label>
              <input
                type="text"
                required
                placeholder="Full Name"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-gray-400 font-bold mb-1.5 ml-1 uppercase text-[10px] tracking-widest">Emergency Contact Phone</label>
              <input
                type="tel"
                required
                placeholder="Phone Number"
                className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 bg-[#0A0A0B] border-gray-800 text-white outline-none transition-all placeholder:text-gray-600"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="md:col-span-2 w-full flex justify-center items-center gap-2 py-4 px-6 border-none rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.2)] text-lg font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] transition-all active:scale-[0.99] mt-8"
        >
          {isLoading ? (
            "Creating Account..."
          ) : (
            <>
              Complete Onboarding <UploadCloud className="w-5 h-5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
