import EmployeeOnboardingForm from "@/components/EmployeeOnboardingForm";
import { HardHat } from "lucide-react";

export default function PublicOnboardingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 p-4 md:p-8 font-sans relative overflow-hidden flex flex-col items-center">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-2xl space-y-8 mt-12 mb-20 animate-in fade-in duration-700">
        <div className="flex flex-col items-center text-center space-y-4">
           <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-[0_0_20px_rgba(79,70,229,0.1)]">
              <HardHat className="w-10 h-10 text-indigo-500" />
           </div>
           <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
             Personnel Registration
           </h1>
           <p className="text-gray-400 max-w-md">
             Welcome to the crew. Please provide your official information to finalize your onboarding.
           </p>
        </div>

        <EmployeeOnboardingForm />
        
        <div className="text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-[0.3em] font-medium">
            Secure Onboarding Portal • Powered by FenceForce Pro
          </p>
        </div>
      </div>
    </div>
  );
}
