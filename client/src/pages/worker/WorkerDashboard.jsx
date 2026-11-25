import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  Wrench,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/dashboard/StatCard';
import NotificationPanel from '../../components/dashboard/NotificationPanel';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';

const WorkerDashboard = () => {
  const { user } = useAuth();
  const { latestNotification } = useSocket() || {};

  const [data, setData] = useState({
    workerProfile: null,
    stats: { total: 0, pending: 0, ongoing: 0, completed: 0, overdue: 0 },
    recentTasks: [],
    notifications: [],
    unreadNotificationCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/worker/dashboard');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load worker dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (latestNotification) {
      setData((prev) => ({
        ...prev,
        notifications: [latestNotification, ...prev.notifications].slice(0, 10),
        unreadNotificationCount: prev.unreadNotificationCount + 1,
      }));
    }
  }, [latestNotification]);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadNotificationCount: Math.max(0, prev.unreadNotificationCount - 1),
      }));
    } catch {
      // Ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadNotificationCount: 0,
      }));
    } catch {
      // Ignore
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="animate-pulse h-48 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-gradient-to-r from-civic-900 to-civic-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Municipal Field Operations
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Worker Dashboard — {user?.name}
          </h1>
          <p className="text-sm text-slate-200 mt-1">
            Department: {data.workerProfile?.department || user?.department || 'General'} &bull;{' '}
            Area: {data.workerProfile?.assignedArea || 'Citywide'}
          </p>
        </div>
        <Link
          to="/worker/tasks"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold self-start"
        >
          <ClipboardList className="w-4 h-4" />
          View All Assigned Tasks
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Assigned"
          value={data.stats.total}
          icon={ClipboardList}
          accentClass="bg-civic-100 text-civic-800"
        />
        <StatCard
          title="Pending Accept"
          value={data.stats.pending}
          icon={Clock}
          accentClass="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Ongoing"
          value={data.stats.ongoing}
          icon={Wrench}
          accentClass="bg-orange-50 text-orange-700"
        />
        <StatCard
          title="Completed"
          value={data.stats.completed}
          icon={CheckCircle2}
          accentClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Overdue"
          value={data.stats.overdue}
          icon={AlertTriangle}
          accentClass="bg-rose-50 text-rose-700"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Priority &amp; Upcoming Tasks</h2>
            <Link
              to="/worker/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:underline"
            >
              All Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {data.recentTasks.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No tasks assigned to you yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recentTasks.map((task) => (
                <div
                  key={task._id}
                  className="p-5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded">
                        {task.complaintId}
                      </span>
                      <StatusBadge status={task.status} />
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <h3 className="font-semibold text-slate-900">{task.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-3">
                      <span>{task.location?.address}</span>
                      {task.deadline && (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          Due {new Date(task.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <Link
                    to={`/worker/tasks/${task._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-center"
                  >
                    Open Task <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <NotificationPanel
            notifications={data.notifications}
            unreadCount={data.unreadNotificationCount}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
