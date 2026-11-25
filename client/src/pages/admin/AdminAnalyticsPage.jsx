import { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Download, Star, Clock, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import { DEPARTMENTS } from '../../constants/civicConstants';
import StatCard from '../../components/dashboard/StatCard';

const PIE_COLORS = ['#64748b', '#2563eb', '#d97706', '#dc2626', '#991b1b'];

const AdminAnalyticsPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const [analytics, setAnalytics] = useState(null);
  const [workerPerf, setWorkerPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const workerParams = { ...params };
      if (departmentFilter !== 'All') workerParams.department = departmentFilter;

      const [analyticsRes, workersRes] = await Promise.all([
        api.get('/admin/analytics', { params }),
        api.get('/admin/analytics/workers', { params: workerParams }),
      ]);

      setAnalytics(analyticsRes.data);
      setWorkerPerf(workersRes.data.workers || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, departmentFilter]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExportCsv = () => {
    if (!analytics) return;
    const rows = [
      ['Metric', 'Value'],
      ['Total Complaints', analytics.summary.totalComplaints],
      ['Resolved Complaints', analytics.summary.resolvedComplaints],
      ['Resolution Rate (%)', analytics.summary.resolutionRate],
      ['Average Resolution Time (hrs)', analytics.summary.averageResolutionHours],
      ['Overdue Complaints', analytics.summary.overdueCount],
      ['Citizen Satisfaction (1-5)', analytics.summary.averageRating],
      [],
      ['Worker', 'Department', 'Total Assigned', 'Completed', 'Pending', 'Overdue', 'Resolution Rate (%)', 'Avg Completion (hrs)'],
      ...workerPerf.map((w) => [
        w.name,
        w.department,
        w.totalAssigned,
        w.completed,
        w.pending,
        w.overdue,
        w.resolutionRate,
        w.avgCompletionHours,
      ]),
    ];

    const csv = rows.map((r) => r.map((v) => `"${v ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scms-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
            Executive Insights
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-civic-900 mt-1">
            Municipal Analytics &amp; Worker Performance
          </h1>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-civic-800 hover:bg-civic-700 text-white text-sm font-semibold self-start"
        >
          <Download className="w-4 h-4" />
          Export CSV Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Department (Worker Analytics)
          </label>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {analytics && (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Total Complaints"
              value={analytics.summary.totalComplaints}
              icon={ClipboardList}
              accentClass="bg-civic-100 text-civic-800"
            />
            <StatCard
              title="Resolution Rate"
              value={`${analytics.summary.resolutionRate}%`}
              icon={CheckCircle2}
              accentClass="bg-emerald-50 text-emerald-700"
            />
            <StatCard
              title="Avg Resolution"
              value={`${analytics.summary.averageResolutionHours}h`}
              icon={Clock}
              accentClass="bg-sky-50 text-sky-700"
            />
            <StatCard
              title="Overdue"
              value={analytics.summary.overdueCount}
              icon={AlertTriangle}
              accentClass="bg-rose-50 text-rose-700"
            />
            <StatCard
              title="Citizen Rating"
              value={
                analytics.summary.totalRatings > 0
                  ? `${analytics.summary.averageRating}/5`
                  : 'N/A'
              }
              icon={Star}
              accentClass="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">
                Complaints Over Time
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.complaintsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#0F2942"
                      fill="#cbd5e1"
                    />
                    <Area
                      type="monotone"
                      dataKey="resolved"
                      name="Closed"
                      stroke="#059669"
                      fill="#a7f3d0"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">
                Category-wise Distribution
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name="Complaints" fill="#1E4E79" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">
                Priority Distribution
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.priorityStats}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {analytics.priorityStats.map((entry, idx) => (
                        <Cell
                          key={entry.name}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="font-bold text-slate-900 mb-4">
                Department Performance
              </h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.departmentPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Assigned" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closed" name="Closed" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Worker Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-900">Worker Performance Metrics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Worker</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Total Assigned</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Overdue</th>
                <th className="py-3 px-4">Resolution Rate</th>
                <th className="py-3 px-4">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {workerPerf.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No worker performance records for the selected filters.
                  </td>
                </tr>
              ) : (
                workerPerf.map((w) => (
                  <tr key={w.workerProfileId} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {w.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{w.department}</td>
                    <td className="py-3.5 px-4">{w.totalAssigned}</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-semibold">
                      {w.completed}
                    </td>
                    <td className="py-3.5 px-4 text-amber-700">{w.pending}</td>
                    <td className="py-3.5 px-4 text-rose-700 font-semibold">
                      {w.overdue}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{w.resolutionRate}%</td>
                    <td className="py-3.5 px-4">{w.avgCompletionHours} hrs</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;
