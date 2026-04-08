import AdminSidebar from "@/components/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0A0A0B] flex text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Sidebar - Desktop and Mobile (via absolute) */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen relative overflow-hidden">
        {/* Background Decorative Glow (Common across all admin pages) */}
        <div className="absolute top-0 right-0 w-full h-[50%] overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-[10%] -right-[10%] w-[60%] h-[100%] rounded-full bg-indigo-600/5 blur-[150px]" />
          <div className="absolute top-[20%] left-[20%] w-[30%] h-[60%] rounded-full bg-blue-600/5 blur-[120px]" />
        </div>

        <div className="relative z-10 p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
