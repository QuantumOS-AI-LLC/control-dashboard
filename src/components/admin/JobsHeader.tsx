"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import CreateJobModal from "./CreateJobModal";

export default function JobsHeader() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-gray-800/50 pb-6 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Management</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Schedule installations, monitor progress, and finalize jobs.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Create New Installation
        </button>
      </div>

      <CreateJobModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
