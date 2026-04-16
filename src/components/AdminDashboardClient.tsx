"use client";

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { approveTimesheet, rejectTimesheet, bulkApproveTimesheets } from '@/app/actions/timesheet';

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

export default function AdminDashboardClient({ revenueData, timesheets }: { revenueData: any[], timesheets: any[] }) {
  const [mounted, setMounted] = React.useState(false);
  const [selectedTimesheets, setSelectedTimesheets] = React.useState<string[]>([]);
  const [rejectModal, setRejectModal] = React.useState<{ isOpen: boolean, id: string | null, reason: string }>({
    isOpen: false,
    id: null,
    reason: ''
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Aggregate data for pie chart from real labor cost or other categories
  const expenseData = [
    { name: '1099 Labor', value: timesheets.reduce((acc, ts) => acc + (ts.totalHours * (ts.employee.payRate || 0)), 0) || 5000 },
    { name: 'Equipment Rent', value: 3500 },
    { name: 'Materials', value: 8000 },
    { name: 'Gas & Fleet', value: 2000 },
  ];

  const handleBulkApprove = async () => {
    if (selectedTimesheets.length === 0) return;
    await bulkApproveTimesheets(selectedTimesheets);
    setSelectedTimesheets([]);
  };

  const handleRejectSubmit = async () => {
    if (rejectModal.id && rejectModal.reason) {
      await rejectTimesheet(rejectModal.id, rejectModal.reason);
      setRejectModal({ isOpen: false, id: null, reason: '' });
    }
  };

  return (
    <>
      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#14151A] border border-gray-800 rounded-xl p-5 shadow-lg">
          <h3 className="text-lg font-medium text-white mb-6">Revenue vs 1099 Labor</h3>
          <div className="h-[250px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                  <XAxis dataKey="name" stroke="#718096" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#718096" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="labor" name="1099 Labor" fill="#EC4899" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="revenue" name="Revenue" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-gray-900/20 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        <div className="bg-[#14151A] border border-gray-800 rounded-xl p-5 shadow-lg flex flex-col">
          <h3 className="text-lg font-medium text-white mb-2">Expenses Breakdown</h3>
          <div className="h-[250px] w-full flex-1">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748', borderRadius: '8px' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full bg-gray-900/20 animate-pulse rounded-lg" />
            )}
          </div>
        </div>
      </div>

      {/* Timesheet Review Table */}
      <div className="bg-[#14151A] border border-gray-800 rounded-xl p-5 shadow-lg mt-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">Recent Timesheets</h3>
          <div className="flex items-center gap-3">
            {selectedTimesheets.length > 0 && (
              <button
                onClick={handleBulkApprove}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-bold transition-all shadow-sm flex items-center gap-1"
              >
                Approve Selected ({selectedTimesheets.length})
              </button>
            )}
            <button className="text-sm text-indigo-400 hover:text-indigo-300 font-medium">View All</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-[#1A1C23] border-b border-gray-800">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg w-12">
                  <input
                    type="checkbox"
                    className="rounded border-gray-700 bg-gray-800 text-indigo-600"
                    checked={selectedTimesheets.length === timesheets.length && timesheets.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedTimesheets(timesheets.map(t => t.id));
                      else setSelectedTimesheets([]);
                    }}
                  />
                </th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3 text-right rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.length > 0 ? (
                timesheets.map((ts, i) => (
                  <tr key={ts.id} className="border-b border-gray-800 hover:bg-[#1A1C23] transition-colors">
                    <td className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        className="rounded border-gray-700 bg-gray-800 text-indigo-600"
                        checked={selectedTimesheets.includes(ts.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedTimesheets([...selectedTimesheets, ts.id]);
                          else setSelectedTimesheets(selectedTimesheets.filter(id => id !== ts.id));
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 font-bold overflow-hidden uppercase">
                         {(ts.employee.name || ts.employee.email || "E").charAt(0)}
                      </div>
                      {ts.employee.name || ts.employee.email}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{new Date(ts.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-300 truncate max-w-[150px]">{ts.job.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{ts.totalHours} hrs</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {ts.status === 'APPROVED' ? (
                        <span className="text-xs text-green-400 flex items-center gap-1 justify-end font-medium">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      ) : ts.status === 'REJECTED' ? (
                        <span className="text-xs text-red-400 flex items-center gap-1 justify-end font-medium group relative cursor-help">
                          <XCircle className="w-3 h-3" /> Rejected
                          <span className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white p-2 rounded shadow-lg text-[10px] w-48 z-50">
                            {ts.rejectionReason || "No reason provided"}
                          </span>
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setRejectModal({ isOpen: true, id: ts.id, reason: '' })}
                            className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-shadow flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Reject
                          </button>
                          <button onClick={async (e) => { const tsId = e.currentTarget.dataset.id; if (tsId) await approveTimesheet(tsId); }} data-id={ts.id} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md transition-shadow flex items-center gap-1 shadow-sm">
                            <CheckCircle className="w-3 h-3" /> Approve
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 italic w-full">No recent timesheets found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#14151A] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <XCircle className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-bold text-white">Reject Timesheet</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">Please provide a reason for rejecting this timesheet. The employee will see this message on their dashboard.</p>
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="e.g. Incorrect hours logged for site visit..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] mb-6"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejectModal({ isOpen: false, id: null, reason: '' })}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!rejectModal.reason}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-all shadow-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
