import { Bell, CheckCheck, CircleDot } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationPanel = ({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-civic-700" />
          <h2 className="font-bold text-slate-900 text-sm">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1 text-xs font-semibold text-civic-700 hover:text-civic-900"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="p-6 text-center text-sm text-slate-500">
          No notifications yet. Updates on your complaints will appear here.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {notifications.map((item) => (
            <li
              key={item._id}
              className={`p-4 transition-colors ${
                item.isRead ? 'bg-white' : 'bg-sky-50/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <CircleDot
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      item.isRead ? 'text-slate-300' : 'text-emerald-600'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleString()}</span>
                      {item.complaintId && (
                        <Link
                          to={`/complaints/${item.complaintId}`}
                          className="font-semibold text-civic-700 hover:underline"
                        >
                          View Complaint
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(item._id)}
                    className="text-xs font-medium text-civic-700 hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationPanel;
