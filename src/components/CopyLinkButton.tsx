"use client";

import { Link as LinkIcon } from "lucide-react";

export default function CopyLinkButton() {
  const copyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/onboard`);
    alert("Registration link copied to clipboard!");
  };

  return (
    <button 
      onClick={copyLink}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all whitespace-nowrap"
    >
      Copy URL
    </button>
  );
}
