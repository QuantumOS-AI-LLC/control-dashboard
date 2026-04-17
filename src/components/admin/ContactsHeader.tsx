"use client";

import React, { useState } from "react";
import { Users, Plus } from "lucide-react";
import CreateContactModal from "./CreateContactModal";

interface ContactsHeaderProps {
  totalContacts: number;
}

export default function ContactsHeader({ totalContacts }: ContactsHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="bg-indigo-600/20 p-3 rounded-2xl border border-indigo-500/30">
          <Users className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-none">Intelligence Backup</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-2">
            {totalContacts} Tactical Contact Records Active
          </p>
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-[0_10px_40px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_50px_rgba(79,70,229,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] group"
      >
        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        Deploy New Contact
      </button>

      <CreateContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
