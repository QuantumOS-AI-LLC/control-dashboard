import EmployeeOnboardingForm from "@/components/EmployeeOnboardingForm";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import OnboardingApprovalList from "@/components/OnboardingApprovalList";
import { getPendingUsers } from "@/app/actions/onboarding";
import CopyLinkButton from "@/components/CopyLinkButton";

export default async function OnboardingPage() {
  const pendingUsers = await getPendingUsers();

  return (
    <div className="min-h-screen bg-[#0F0F13] text-gray-100 p-4 md:p-8 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8 z-10 relative">
        <div className="flex justify-between items-center bg-[#14151A]/80 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-gray-800">
           <Link href="/admin/dashboard" className="flex items-center gap-2 text-indigo-400 font-bold hover:gap-3 transition-all">
             <ArrowLeft className="w-5 h-5 focus:translate-x-1" /> Back to Dashboard
           </Link>
           
           <div className="flex gap-4">
             <SignOutButton />
           </div>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-600 rounded-lg">
                <LinkIcon className="w-4 h-4 text-white" />
             </div>
             <div>
                <p className="text-xs font-bold text-white tracking-wide">Public Registration Link</p>
                <p className="text-[10px] text-gray-500">Send this URL to new hires for self-onboarding.</p>
             </div>
           </div>
           <CopyLinkButton />
        </div>
        
        {/* New Approval Section */}
        <section className="space-y-4">
          <OnboardingApprovalList initialUsers={pendingUsers} />
        </section>

        {/* Manual Onboarding Section */}
        <section className="pt-8 border-t border-gray-800/50">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Manual Team Addition</h3>
            <p className="text-sm text-gray-400 mt-1">Use this form to manually onboard a team member if they are sitting with you.</p>
          </div>
          <EmployeeOnboardingForm />
        </section>
      </div>
    </div>
  );
}
