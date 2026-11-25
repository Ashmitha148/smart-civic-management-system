import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, AlertTriangle, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../../constants/civicConstants';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';

const AdminComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (status !== 'All') params.status = status;
      if (category !== 'All') params.category = category;
      if (priority !== 'All') params.priority = priority;
      if (overdueOnly) params.overdue = 'true';
      if (search.trim()) params.search = search.trim();

      const { data } = await api.get('/admin/complaints', { params });
      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, [status, category, priority, overdueOnly, search]);

  useEffect(() => {
    const timer = setTimeout(fetchComplaints, 250);
    return () => clearTimeout(timer);
  }, [fetchComplaints]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
          Administrative Management
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-civic-900 mt-1">
          All Citizen Complaints
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ID, title, or address..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All Statuses</option>
            {COMPLAINT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All Categories</option>
            {COMPLAINT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="All">All Priorities</option>
            {COMPLAINT_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <label className="md:col-span-2 inline-flex items-center gap-2 text-xs font-semibold text-rose-700 cursor-pointer">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="rounded border-slate-300"
          />
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue Only
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">No complaints found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Complaint &amp; Citizen</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Worker</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {complaints.map((c) => {
                  const isOverdue =
                    c.deadline &&
                    new Date(c.deadline) < new Date() &&
                    !['Closed', 'Rejected'].includes(c.status);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50">
                      <td className="py-4 px-4 font-mono font-bold text-civic-700 whitespace-nowrap">
                        {c.complaintId}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-900 line-clamp-1">
                          {c.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          By {c.userId?.name || 'Citizen'} &bull;{' '}
                          {new Date(c.createdAt).toLocaleDateString()}
                          {isOverdue && (
                            <span className="ml-2 text-rose-600 font-bold">
                              OVERDUE
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">{c.category}</td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <PriorityBadge priority={c.priority} />
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                        {c.assignedWorkerId ? (
                          <span className="font-semibold text-slate-800">
                            {c.assignedWorkerId.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/complaints/${c._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-civic-50 text-xs font-semibold text-civic-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminComplaintsPage;
