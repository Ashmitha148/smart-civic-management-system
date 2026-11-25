import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Calendar, ClipboardList } from 'lucide-react';
import api from '../../api/axios';
import { COMPLAINT_STATUSES } from '../../constants/civicConstants';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';

const WorkerTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (status !== 'All') params.status = status;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get('/worker/tasks', { params });
      setTasks(data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned tasks.');
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const t = setTimeout(fetchTasks, 250);
    return () => clearTimeout(t);
  }, [fetchTasks]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-civic-600">
          Field Assignments
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-civic-900 mt-1">
          My Assigned Tasks
        </h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by complaint ID, title, or address..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div className="md:col-span-4">
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
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse h-40 bg-slate-100" />
        ) : tasks.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-800">No assigned tasks found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">ID</th>
                  <th className="py-3.5 px-4">Task &amp; Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Deadline</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50">
                    <td className="py-4 px-4 font-mono font-bold text-civic-700 whitespace-nowrap">
                      {task.complaintId}
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.location?.address}</p>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">{task.category}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <PriorityBadge priority={task.priority} />
                    </td>
                    <td className="py-4 px-4 text-xs whitespace-nowrap">
                      {task.deadline ? (
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <Link
                        to={`/worker/tasks/${task._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-civic-50 text-xs font-semibold text-civic-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Open Task
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkerTasksPage;
