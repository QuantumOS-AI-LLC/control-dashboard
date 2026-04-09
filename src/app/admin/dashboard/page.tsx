import { Users, DollarSign, Briefcase, TrendingUp, Clock, UserPlus } from 'lucide-react';
import { prisma } from "@/lib/prisma";
import { JobStatus } from "@prisma/client";
import SignOutButton from "@/components/SignOutButton";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch real data from Prisma
  const [userCount, timesheets, jobs] = await Promise.all([
    prisma.user.count({ where: { role: { in: ['CREW', 'FOREMAN', 'MANAGER'] } } }),
    prisma.timesheet.findMany({
      include: { employee: true, job: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    }),
    prisma.job.findMany()
  ]);

  // Calculate stats
  const totalLaborCost = timesheets.reduce((acc, ts) => acc + (ts.totalHours * (ts.employee.payRate || 0)), 0);
  const activeJobs = jobs.filter(j => j.status === JobStatus.Scheduled || j.status === JobStatus.In_Progress).length;
  const completedJobs = jobs.filter(j => j.status === JobStatus.Completed).length;

  // For Demo/Mocking the weekly revenue data since the DB doesn't have revenue tables yet
  const revenueData = [
    { name: 'Week 1', revenue: 9000, labor: totalLaborCost / 4 || 3500 },
    { name: 'Week 2', revenue: 14000, labor: totalLaborCost / 3 || 4000 },
    { name: 'Week 3', revenue: 10500, labor: totalLaborCost / 2 || 3800 },
    { name: 'Week 4', revenue: 13000, labor: totalLaborCost || 5000 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center pb-6 border-b border-gray-800/50 gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Main Dashboard</h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Daily business metrics and growth tracking.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-[#14151A] rounded-xl p-1 border border-gray-800 shadow-inner">
            {['Today', 'This Week', 'This Month'].map((tab) => (
              <button 
                key={tab} 
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all uppercase tracking-widest ${tab === 'This Week' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-gray-500 hover:text-white'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card title="Personnel" value={userCount.toString()} icon={<Users className="w-5 h-5" />} trend="+0%" isPositive={true} />
        <Card title="Active Projects" value={activeJobs.toString()} icon={<Briefcase className="w-5 h-5" />} trend="Active" isPositive={true} />
        <Card title="Weekly Labor" value={`$${totalLaborCost.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} trend="+2%" isPositive={false} />
        <Card 
          title="Total Completed" 
          value={completedJobs.toString()} 
          icon={<TrendingUp className="w-5 h-5" />} 
          trend="Total" 
          isPositive={true} 
          subtitle={`Eff: ${((completedJobs / (jobs.length || 1)) * 100).toFixed(1)}%`}
          special
        />
      </div>

      {/* Insight Banner */}
      <div className="bg-[#1C1A31] border border-indigo-900/50 rounded-xl p-4 flex items-center gap-3">
        <Clock className="w-5 h-5 text-indigo-400" />
        <p className="text-sm text-indigo-200 font-medium">
          Currently tracking <strong className="text-white">{activeJobs}</strong> active projects. Review pending timesheets to maintain payroll accuracy.
        </p>
      </div>

      {/* Pass data to Client Component for charts */}
      <AdminDashboardClient revenueData={revenueData} timesheets={timesheets as any} />
    </div>
  );
}

function Card({ title, value, icon, trend, isPositive, special, subtitle }: any) {
  return (
    <div className={`rounded-xl p-5 border ${special ? 'bg-[#1C1A31] border-indigo-500/30 shadow-[0_0_15px_rgba(79,70,229,0.1)]' : 'bg-[#14151A] border-gray-800'} relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-gray-400 text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-lg ${special ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-800 text-gray-400'}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl font-bold text-white">{value}</h2>
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
      <div className="mt-2 text-xs">
        <span className={`font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      </div>
      {special && (
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
      )}
    </div>
  );
}
