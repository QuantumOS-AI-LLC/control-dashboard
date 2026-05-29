"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle, FileText, Map, ShieldCheck, X } from "lucide-react";
import { useParams } from "next/navigation";

export default function ClientUploadPage() {
  const params = useParams();
  const jobId = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [planFile, setPlanFile] = useState<{ name: string, base64: string } | null>(null);
  const [certFile, setCertFile] = useState<{ name: string, base64: string } | null>(null);

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: "plan" | "cert") => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Basic size validation (limit to ~5MB for DB storage efficiency)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Please upload files under 5MB.`);
        return;
      }

      try {
        const base64 = await convertToBase64(file);
        if (type === "plan") {
          setPlanFile({ name: file.name, base64 });
        } else {
          setCertFile({ name: file.name, base64 });
        }
        setError(null);
      } catch (err) {
        setError("Error processing file. Please try again.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planFile && !certFile) {
      setError("Please upload at least one document.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/client/${jobId}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planFileData: planFile?.base64,
          localisationCertificateData: certFile?.base64,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to upload documents. Please contact support.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0F0F13] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-[#14151A]/90 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-10 text-center shadow-[0_20px_50px_rgba(16,185,129,0.1)]">
          <div className="bg-emerald-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-500/20">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mb-3">Documents Received!</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Thank you! Your fence plan and localisation certificate have been successfully securely uploaded. Our scheduling team has been notified and will proceed with the next steps.
          </p>
          <div className="bg-emerald-950/20 p-4 rounded-2xl flex items-center justify-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider border border-emerald-900/30">
            <ShieldCheck className="w-4 h-4" /> Securely Transmitted
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-4 md:p-8 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

      <div className="max-w-xl w-full z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">Required Documents</h1>
          <p className="text-gray-400 text-sm md:text-base max-w-sm mx-auto leading-relaxed">
            Please upload your official property layout documents to proceed with scheduling your fence installation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#14151A]/80 backdrop-blur-2xl p-8 border border-gray-800 rounded-[2.5rem] shadow-2xl space-y-8">
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 text-sm font-bold text-center">
              {error}
            </div>
          )}

          {/* Fence Plan Upload */}
          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400 mb-4">
              <Map className="w-4 h-4" /> Property Fence Plan
            </label>
            
            {!planFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-800 rounded-2xl cursor-pointer bg-[#0A0A0B] hover:bg-gray-900/50 hover:border-indigo-500/40 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-gray-600 group-hover:text-indigo-400 transition-colors" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tap to upload plan (PDF/Img)</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, "plan")} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-gray-200 truncate">{planFile.name}</span>
                </div>
                <button type="button" onClick={() => setPlanFile(null)} className="p-1.5 hover:bg-indigo-900/40 rounded-lg transition-colors text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Localisation Certificate Upload */}
          <div>
            <label className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400 mb-4">
              <FileText className="w-4 h-4" /> Localisation Certificate
            </label>
            
            {!certFile ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-800 rounded-2xl cursor-pointer bg-[#0A0A0B] hover:bg-gray-900/50 hover:border-emerald-500/40 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-8 h-8 mb-3 text-gray-600 group-hover:text-emerald-400 transition-colors" />
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tap to upload certificate</p>
                </div>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileChange(e, "cert")} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-bold text-gray-200 truncate">{certFile.name}</span>
                </div>
                <button type="button" onClick={() => setCertFile(null)} className="p-1.5 hover:bg-emerald-900/40 rounded-lg transition-colors text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!planFile && !certFile)}
            className="w-full py-5 px-6 border-none rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.15)] text-sm font-black text-white bg-white/10 hover:bg-white/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:hover:bg-white/10 uppercase tracking-[0.2em]"
          >
            {isSubmitting ? "Processing..." : "Submit Documents"}
          </button>
        </form>
        
        <p className="text-center text-[10px] text-gray-600 mt-6 uppercase font-bold tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3" /> Encrypted & Secure Upload
        </p>
      </div>
    </div>
  );
}
