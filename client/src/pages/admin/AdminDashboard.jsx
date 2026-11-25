import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileCheck2,
  Inbox,
  Users,
  Wrench,
  XCircle,
  ArrowRight,
  Activity,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import StatCard from '../../components/dashboard/StatCard';
import NotificationPanel from '../../components/dashboard/NotificationPanel';
import StatusBadge from '../../components/common/StatusBadge';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { latestNotification } = useSocket() || {};

  const [data, setData] = useState({
    stats: {
      total: 0,
      submitted: 0,
      awaitingVerification: 0,
      assigned: 0,
      ongoing: 0,
      resolved: 0,
      rejected: 0,
      overdue: 0,
    },
    categoryStats: [],
    priorityStats: [],
    recentActivity: [],
    notifications: [],
    unreadNotificationCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setError('');
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxCatCount = Math.max(
    1,
    ...(data.categoryStats?.map((c) => c.count) || [1])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-civic-900 to-civic-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Municipal Administration Portal
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Official Control Center — {user?.name}
          </h1>
          <p className="text-sm text-slate-200 mt-1.5">
            Verify citizen complaints, dispatch municipal workers, and audit completion
            evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold"
          >
            <ClipboardList className="w-4 h-4" />
            Manage Complaints
          </Link>
          <Link
            to="/admin/workers"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold"
          >
            <Users className="w-4 h-4" />
            Manage Workers
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Complaints"
          value={data.stats.total}
          icon={ClipboardList}
          accentClass="bg-civic-100 text-civic-800"
        />
        <StatCard
          title="Newly Submitted"
          value={data.stats.submitted}
          icon={Inbox}
          accentClass="bg-sky-50 text-sky-700"
        />
        <StatCard
          title="Awaiting Verification"
          value={data.stats.awaitingVerification}
          icon={Clock}
          accentClass="bg-indigo-50 text-indigo-700"
        />
        <StatCard
          title="Assigned"
          value={data.stats.assigned}
          icon={FileCheck2}
          accentClass="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Ongoing Work"
          value={data.stats.ongoing}
          icon={Wrench}
          accentClass="bg-orange-50 text-orange-700"
        />
        <StatCard
          title="Resolved / Closed"
          value={data.stats.resolved}
          icon={CheckCircle2}
          accentClass="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Rejected"
          value={data.stats.rejected}
          icon={XCircle}
          accentClass="bg-rose-50 text-rose-700"
        />
        <StatCard
          title="Overdue"
          value={data.stats.overdue}
          icon={AlertTriangle}
          accentClass="bg-red-100 text-red-700"
        />
      </div>

      {/* Breakdown + Activity + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          {/* Category Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">
              Category-wise Complaint Distribution
            </h2>
            {data.categoryStats.length === 0 ? (
              <p className="text-sm text-slate-500">No complaints recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {data.categoryStats.map((item) => (
                  <div key={item.category}>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span>{item.category}</span>
                      <span className="font-bold">{item.count}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-civic-700 rounded-full"
                        style={{
                          width: `${Math.round((item.count / maxCatCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">
              Priority-wise Distribution
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.priorityStats.map((item) => (
                <div
                  key={item.priority}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center"
                >
                  <p className="text-2xl font-extrabold text-civic-900">
                    {item.count}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    {item.priority}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-civic-700" />
                <h2 className="font-bold text-slate-900">Recent System Activity</h2>
              </div>
              <Link
                to="/admin/complaints"
                className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:underline"
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {data.recentActivity.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No recent activity.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentActivity.map((act) => (
                  <li key={act._id} className="p-4 text-sm flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-civic-700">
                          {act.complaintId?.complaintId || 'SCMS'}
                        </span>
                        <StatusBadge status={act.status} />
                      </div>
                      <p className="text-slate-700 mt-1 text-xs">{act.remarks}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        By {act.updatedBy?.name || 'System'} ({act.updatedByRole}) &bull;{' '}
                        {new Date(act.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {act.complaintId?._id && (
                      <Link
                        to={`/admin/complaints/${act.complaintId._id}`}
                        className="text-xs font-semibold text-civic-700 hover:underline shrink-0"
                      >
                        Open
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Notifications */}
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

export default AdminDashboard;
