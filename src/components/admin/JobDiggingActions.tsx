"use client";

import React, { useState } from "react";
import { MessageSquare, ShieldAlert, FileSpreadsheet, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { triggerDiggingAction } from "@/app/actions/job";

interface JobDiggingActionsProps {
  jobId: string;
  jobExpectationSent: boolean;
  infoExcavationRequested: boolean;
  diggingBilled: boolean;
  diggingInvoiceUrl: string | null;
  isDisabled: boolean;
}

export default function JobDiggingActions({
  jobId,
  jobExpectationSent: initialExpectation,
  infoExcavationRequested: initialExcavation,
  diggingBilled: initialBilled,
  diggingInvoiceUrl: initialInvoiceUrl,
  isDisabled
}: JobDiggingActionsProps) {
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [expectationSent, setExpectationSent] = useState(initialExpectation);
  const [excavationRequested, setExcavationRequested] = useState(initialExcavation);
  const [diggingBilled, setDiggingBilled] = useState(initialBilled);
  const [invoiceUrl, setInvoiceUrl] = useState(initialInvoiceUrl);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (type: "expectation" | "excavation" | "bill") => {
    setLoadingType(type);
    setError(null);
    try {
      const res = await triggerDiggingAction(jobId, type);
      if (res.success && res.job) {
        if (type === "expectation") setExpectationSent(true);
        if (type === "excavation") setExcavationRequested(true);
        if (type === "bill") {
          setDiggingBilled(true);
          if (res.job.diggingInvoiceUrl) {
            setInvoiceUrl(res.job.diggingInvoiceUrl);
          }
        }
      } else {
        setError(res.error || "Failed to trigger CRM action");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <section className="bg-[#14151A]/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-800 shadow-2xl space-y-6">
      <h2 className="text-sm font-extrabold text-indigo-400 uppercase tracking-[0.2em]">Operations Webhooks</h2>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Expectation SMS */}
        <button
          onClick={() => handleAction("expectation")}
          disabled={expectationSent || isDisabled || loadingType !== null}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
            expectationSent
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-gray-900/50 border-gray-800 text-white hover:bg-gray-900 hover:border-gray-700 disabled:opacity-50"
          }`}
        >
          <span className="flex items-center gap-3">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>Expectation SMS</span>
          </span>
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest font-black">
            {loadingType === "expectation" ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : expectationSent ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Sent
              </>
            ) : (
              "Send SMS"
            )}
          </span>
        </button>

        {/* Info-Excavation Request */}
        <button
          onClick={() => handleAction("excavation")}
          disabled={excavationRequested || isDisabled || loadingType !== null}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
            excavationRequested
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-gray-900/50 border-gray-800 text-white hover:bg-gray-900 hover:border-gray-700 disabled:opacity-50"
          }`}
        >
          <span className="flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span>Info-Excavation Status</span>
          </span>
          <span className="flex items-center gap-2 text-xs uppercase tracking-widest font-black">
            {loadingType === "excavation" ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            ) : excavationRequested ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Requested
              </>
            ) : (
              "Request Site Plan"
            )}
          </span>
        </button>

        {/* Request Digging Bill (35%) */}
        {invoiceUrl ? (
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-white text-sm font-black transition-all shadow-[0_10px_20px_rgba(79,70,229,0.3)]"
          >
            <span className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-indigo-200" />
              <span>Digging Invoice (35%)</span>
            </span>
            <span className="flex items-center gap-1 text-xs uppercase tracking-widest">
              View Invoice <ExternalLink className="w-3.5 h-3.5" />
            </span>
          </a>
        ) : (
          <button
            onClick={() => handleAction("bill")}
            disabled={diggingBilled || isDisabled || loadingType !== null}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border text-sm font-bold transition-all ${
              diggingBilled
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-gray-900/50 border-gray-800 text-white hover:bg-gray-900 hover:border-gray-700 disabled:opacity-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
              <span>Digging Bill (35%)</span>
            </span>
            <span className="flex items-center gap-2 text-xs uppercase tracking-widest font-black">
              {loadingType === "bill" ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              ) : diggingBilled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Generating...
                </>
              ) : (
                "Request Bill"
              )}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
