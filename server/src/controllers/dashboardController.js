import Complaint from '../models/Complaint.js';
import Notification from '../models/Notification.js';

const PENDING_STATUSES = ['Submitted', 'Under Review', 'Verified', 'Reopened'];
const IN_PROGRESS_STATUSES = ['Assigned', 'In Progress'];
const RESOLVED_STATUSES = ['Resolved - Pending Verification', 'Closed'];

export const getCitizenDashboard = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      recentComplaints,
      notifications,
      unreadNotificationCount,
    ] = await Promise.all([
      Complaint.countDocuments({ userId }),
      Complaint.countDocuments({ userId, status: { $in: PENDING_STATUSES } }),
      Complaint.countDocuments({ userId, status: { $in: IN_PROGRESS_STATUSES } }),
      Complaint.countDocuments({ userId, status: { $in: RESOLVED_STATUSES } }),
      Complaint.find({ userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total: totalComplaints,
        pending: pendingComplaints,
        inProgress: inProgressComplaints,
        resolved: resolvedComplaints,
      },
      recentComplaints,
      notifications,
      unreadNotificationCount,
    });
  } catch (error) {
    return next(error);
  }
};
