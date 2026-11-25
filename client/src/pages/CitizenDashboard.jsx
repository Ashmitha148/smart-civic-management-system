import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FilePlus2,
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle2,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import StatCard from '../components/dashboard/StatCard';
import NotificationPanel from '../components/dashboard/NotificationPanel';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';

const CitizenDashboard = () => {
  const { user, updateProfile } = useAuth();
  const { latestNotification } = useSocket() || {};
  const [dashboardData, setDashboardData] = useState({
    stats: { total: 0, pending: 0, inProgress: 0, resolved: 0 },
    recentComplaints: [],
    notifications: [],
    unreadNotificationCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState('');

  const fetchDashboard = async () => {
    try {
      setError('');
      const { data } = await api.get('/dashboard/citizen');
      setDashboardData({
        stats: data.stats,
        recentComplaints: data.recentComplaints || [],
        notifications: data.notifications || [],
        unreadNotificationCount: data.unreadNotificationCount || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (latestNotification) {
      setDashboardData((prev) => ({
        ...prev,
        notifications: [latestNotification, ...prev.notifications].slice(0, 10),
        unreadNotificationCount: prev.unreadNotificationCount + 1,
      }));
    }
  }, [latestNotification]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleMarkNotificationRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setDashboardData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadNotificationCount: Math.max(0, prev.unreadNotificationCount - 1),
      }));
    } catch {
      // Ignore transient errors
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setDashboardData((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadNotificationCount: 0,
      }));
    } catch {
      // Ignore transient errors
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback('');
    try {
      await updateProfile(profileForm);
      setEditingProfile(false);
      setProfileFeedback('Profile updated.');
    } catch (err) {
      setProfileFeedback(err.response?.data?.message || 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-24 bg-slate-200 rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-civic-900 to-civic-700 rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300">
            Citizen Service Dashboard
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-1">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-200 mt-1.5 max-w-xl">
            Monitor the status of your civic complaints, review municipal updates, or
            report a new infrastructure issue in your neighborhood.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 shrink-0">
          <Link
            to="/complaints/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-sm transition-colors"
          >
            <FilePlus2 className="w-4 h-4" />
            Submit New Complaint
          </Link>
          <Link
            to="/complaints"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Complaints"
          value={dashboardData.stats.total}
          icon={ClipboardList}
          accentClass="bg-civic-100 text-civic-800"
        />
        <StatCard
          title="Pending Review"
          value={dashboardData.stats.pending}
          icon={Clock}
          accentClass="bg-sky-50 text-sky-700"
        />
        <StatCard
          title="In Progress"
          value={dashboardData.stats.inProgress}
          icon={Wrench}
          accentClass="bg-amber-50 text-amber-700"
        />
        <StatCard
          title="Resolved"
          value={dashboardData.stats.resolved}
          icon={CheckCircle2}
          accentClass="bg-emerald-50 text-emerald-700"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Complaints */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Recent Complaints</h2>
              <p className="text-xs text-slate-500">
                Your 5 most recently submitted civic reports
              </p>
            </div>
            <Link
              to="/complaints"
              className="inline-flex items-center gap-1 text-sm font-semibold text-civic-700 hover:text-civic-900"
            >
              All Complaints
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {dashboardData.recentComplaints.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800">No complaints submitted yet</h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Spot a pothole, broken streetlight, or water leak? Report it in under two
                minutes.
              </p>
              <Link
                to="/complaints/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-civic-800 text-white text-sm font-semibold hover:bg-civic-700"
              >
                <FilePlus2 className="w-4 h-4" />
                Submit Your First Complaint
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {dashboardData.recentComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-civic-700 bg-civic-50 px-2 py-0.5 rounded border border-civic-100">
                        {complaint.complaintId}
                      </span>
                      <StatusBadge status={complaint.status} />
                      <PriorityBadge priority={complaint.priority} />
                    </div>
                    <h3 className="font-semibold text-slate-900">{complaint.title}</h3>
                    <p className="text-xs text-slate-500">
                      {complaint.category} &bull;{' '}
                      {new Date(complaint.createdAt).toLocaleDateString()} &bull;{' '}
                      {complaint.location?.address}
                    </p>
                  </div>

                  <Link
                    to={`/complaints/${complaint._id}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-center"
                  >
                    View Details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Profile & Notifications */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-civic-100 text-civic-800 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Citizen Profile</h2>
                  <p className="text-xs text-slate-500 capitalize">{user?.role} Account</p>
                </div>
              </div>
              {!editingProfile && (
                <button
                  type="button"
                  onClick={() => setEditingProfile(true)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {profileFeedback && (
              <p className="mb-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5">
                {profileFeedback}
              </p>
            )}

            {editingProfile ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, address: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-civic-800 text-white text-xs font-semibold"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingProfile ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-2.5 text-sm text-slate-600">
                <div className="flex items-center gap-2.5">
                  <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800">{user?.name}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{user?.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{user?.address || 'Not provided'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <NotificationPanel
            notifications={dashboardData.notifications}
            unreadCount={dashboardData.unreadNotificationCount}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllRead}
          />
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
