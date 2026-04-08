import { auth, signIn } from "@/auth";
import { redirect } from "next/navigation";
import { Lock, Mail, HardHat, ArrowRight } from "lucide-react";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  // Check if active session exists
  const session = await auth();

  if (session?.user) {
    const role = session.user.role;
    if (role === "ADMIN" || role === "MANAGER") {
      redirect("/admin/dashboard");
    } else if (role === "FOREMAN" || role === "CREW" || role === "EMPLOYEE") {
      redirect("/employee/dashboard");
    }
  }

  const resolvedSearchParams = await searchParams;
  const errorMsg = resolvedSearchParams?.error === 'CredentialsSignin' ? 'Invalid credentials. Please try again.' : '';

  // Server action to handle the NextAuth v5 sign in
  async function handleLogin(formData: FormData) {
    "use server";
    try {
      const email = formData.get("email");
      const password = formData.get("password");

      if (!email || !password) return;

      const user = await prisma.user.findUnique({
        where: { email: email as string }
      });

      if (!user || user.password !== password) {
        redirect('/?error=CredentialsSignin');
      }

      await signIn("credentials", {
        email,
        password,
        redirectTo: (user.role === "ADMIN" || user.role === "MANAGER") 
          ? "/admin/dashboard" 
          : "/employee/dashboard", 
      });
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.type === 'CredentialsSignin') {
          redirect('/?error=CredentialsSignin');
        } else {
          redirect('/?error=Default');
        }
      }
      throw error;
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex items-center justify-center font-sans overflow-hidden relative">
      {/* Background Graphic Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[150px]" />
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      <div className="z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 px-6 items-center">
        {/* Left Side Branding */}
        <div className="space-y-6 hidden md:block">
          <div className="flex items-center gap-3 text-indigo-500 font-bold text-2xl tracking-tight">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
               <HardHat className="w-8 h-8" />
            </div>
            FenceForce Pro
          </div>
          <h1 className="text-5xl font-extrabold leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            Field Operations <br/> & Management
          </h1>
          <p className="text-gray-400 text-lg max-w-md">
            Streamline your crew's timesheets, track job completion securely, and monitor overall labor KPIs in real-time.
          </p>
        </div>

        {/* Right Side Login Form */}
        <div className="w-full max-w-md mx-auto">
           {/* Mobile Branding (only shows on small screens) */}
           <div className="flex items-center gap-3 text-indigo-500 font-bold text-xl tracking-tight mb-8 md:hidden justify-center">
             <div className="p-2 bg-indigo-500/10 rounded-lg">
               <HardHat className="w-6 h-6" />
             </div>
             FenceForce Pro
           </div>

          <div className="bg-[#14151A]/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Glossy top edge highlight */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-400 mt-1">Sign in to your account to continue</p>
            </div>

            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-lg flex items-center justify-center">
                {errorMsg}
              </div>
            )}

            <form action={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-5 w-5 text-gray-500" />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@example.com"
                    className="w-full pl-11 pr-4 py-3 bg-[#0A0A0B] border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-5 w-5 text-gray-500" />
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-[#0A0A0B] border border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-white outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all flex justify-center items-center gap-2 group active:scale-[0.98] mt-2"
              >
                Sign In 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
          
          <p className="text-center text-xs text-gray-600 mt-6">
            Authorized personnel only. Access is heavily monitored.
          </p>
        </div>
      </div>
    </div>
  );
}
