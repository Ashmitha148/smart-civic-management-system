import Complaint from '../models/Complaint.js';
import Worker from '../models/Worker.js';
import Assignment from '../models/Assignment.js';
import Feedback from '../models/Feedback.js';
import StatusHistory from '../models/StatusHistory.js';
import { checkAndNotifyOverdueComplaints, computeSlaStatus } from '../utils/slaMonitor.js';
import { notifyUser } from '../utils/notify.js';

const buildDateFilter = (startDate, endDate, field = 'createdAt') => {
  const range = {};
  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) range.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      end.setUTCHours(23, 59, 59, 999);
      range.$lte = end;
    }
  }
  return Object.keys(range).length ? { [field]: range } : {};
};

export const getAdminAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const now = new Date();

    const [
      totalComplaints,
      resolvedComplaints,
      overdueCount,
      complaintsOverTime,
      categoryStats,
      priorityStats,
      departmentStats,
      closedWithTimes,
      feedbackAgg,
    ] = await Promise.all([
      Complaint.countDocuments(dateFilter),
      Complaint.countDocuments({
        ...dateFilter,
        status: { $in: ['Resolved - Pending Verification', 'Closed'] },
      }),
      Complaint.countDocuments({
        ...dateFilter,
        deadline: { $ne: null, $lt: now },
        status: { $nin: ['Closed', 'Rejected'] },
      }),
      Complaint.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            resolved: {
              $sum: {
                $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Complaint.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Complaint.aggregate([
        { $match: { ...dateFilter, assignedDepartment: { $ne: null } } },
        {
          $group: {
            _id: '$assignedDepartment',
            total: { $sum: 1 },
            closed: {
              $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] },
            },
          },
        },
      ]),
      Complaint.find({
        ...dateFilter,
        status: 'Closed',
        resolvedAt: { $ne: null },
      })
        .select('createdAt resolvedAt')
        .lean(),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 },
          },
        },
      ]),
    ]);

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    let averageResolutionHours = 0;
    if (closedWithTimes.length > 0) {
      const totalHours = closedWithTimes.reduce((acc, item) => {
        const diff = new Date(item.resolvedAt).getTime() - new Date(item.createdAt).getTime();
        return acc + Math.max(0, diff / 3600000);
      }, 0);
      averageResolutionHours = Number((totalHours / closedWithTimes.length).toFixed(1));
    }

    const feedbackSummary = feedbackAgg[0]
      ? {
          averageRating: Number(feedbackAgg[0].avgRating.toFixed(2)),
          totalRatings: feedbackAgg[0].totalRatings,
        }
      : { averageRating: 0, totalRatings: 0 };

    return res.status(200).json({
      success: true,
      summary: {
        totalComplaints,
        resolvedComplaints,
        resolutionRate,
        averageResolutionHours,
        overdueCount,
        averageRating: feedbackSummary.averageRating,
        totalRatings: feedbackSummary.totalRatings,
      },
      complaintsOverTime: complaintsOverTime.map((d) => ({
        date: d._id,
        total: d.count,
        resolved: d.resolved,
      })),
      categoryStats: categoryStats.map((c) => ({ name: c._id, value: c.count })),
      priorityStats: priorityStats.map((p) => ({ name: p._id, value: p.count })),
      departmentPerformance: departmentStats.map((d) => ({
        department: d._id,
        total: d.total,
        closed: d.closed,
        rate: d.total > 0 ? Math.round((d.closed / d.total) * 100) : 0,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const getWorkerPerformance = async (req, res, next) => {
  try {
    const { workerId, department, startDate, endDate } = req.query;
    const workerFilter = {};
    if (department && department !== 'All') workerFilter.department = department;
    if (workerId && workerId !== 'All') workerFilter.userId = workerId;

    const workers = await Worker.find(workerFilter).sort({ name: 1 }).lean();
    const dateFilter = buildDateFilter(startDate, endDate);
    const now = new Date();

    const assignments = await Assignment.find(dateFilter).lean();

    const performance = workers.map((worker) => {
      const wAssignments = assignments.filter(
        (a) => a.workerId.toString() === worker.userId.toString()
      );
      const totalAssigned = wAssignments.length;
      const completed = wAssignments.filter((a) =>
        ['Approved', 'Submitted for Verification'].includes(a.status)
      ).length;
      const pending = wAssignments.filter((a) =>
        ['Assigned', 'Accepted', 'In Progress', 'Rejected'].includes(a.status)
      ).length;
      const overdue = wAssignments.filter(
        (a) =>
          a.deadline &&
          new Date(a.deadline) < now &&
          !['Approved', 'Submitted for Verification', 'Reassigned'].includes(a.status)
      ).length;

      const completedWithTimes = wAssignments.filter((a) => a.completedAt && a.assignedAt);
      let avgCompletionHours = 0;
      if (completedWithTimes.length > 0) {
        const sumH = completedWithTimes.reduce((acc, a) => {
          return (
            acc +
            Math.max(
              0,
              (new Date(a.completedAt).getTime() - new Date(a.assignedAt).getTime()) /
                3600000
            )
          );
        }, 0);
        avgCompletionHours = Number((sumH / completedWithTimes.length).toFixed(1));
      }

      const resolutionRate =
        totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

      return {
        workerId: worker.userId,
        workerProfileId: worker._id,
        name: worker.name,
        department: worker.department,
        assignedArea: worker.assignedArea,
        availability: worker.availability,
        totalAssigned,
        completed,
        pending,
        overdue,
        resolutionRate,
        avgCompletionHours,
      };
    });

    return res.status(200).json({
      success: true,
      workers: performance,
    });
  } catch (error) {
    return next(error);
  }
};

export const getHeatmapData = async (req, res, next) => {
  try {
    const { category, priority, startDate, endDate } = req.query;
    const filter = {
      'location.latitude': { $ne: null },
      'location.longitude': { $ne: null },
      ...buildDateFilter(startDate, endDate),
    };

    if (category && category !== 'All') filter.category = category;
    if (priority && priority !== 'All') filter.priority = priority;

    const complaints = await Complaint.find(filter)
      .select('complaintId title category priority status location createdAt deadline')
      .lean();

    const points = complaints.map((c) => ({
      _id: c._id,
      complaintId: c.complaintId,
      title: c.title,
      category: c.category,
      priority: c.priority,
      status: c.status,
      address: c.location.address,
      lat: c.location.latitude,
      lng: c.location.longitude,
      intensity:
        c.priority === 'Emergency' || c.priority === 'Critical'
          ? 1.0
          : c.priority === 'High'
            ? 0.75
            : c.priority === 'Medium'
              ? 0.5
              : 0.3,
      createdAt: c.createdAt,
      sla: computeSlaStatus(c.deadline, c.status),
    }));

    return res.status(200).json({
      success: true,
      count: points.length,
      points,
    });
  } catch (error) {
    return next(error);
  }
};

export const escalateComplaint = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (['Closed', 'Rejected'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: 'Closed or rejected complaints cannot be escalated.',
      });
    }

    complaint.isEscalated = true;
    complaint.escalatedAt = new Date();
    complaint.priority = 'Emergency';
    complaint.escalationRemarks =
      remarks?.trim() || 'Escalated due to SLA breach / urgent municipal attention.';
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: complaint.status,
      status: complaint.status,
      remarks: `ESCALATED: ${complaint.escalationRemarks}`,
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    const notifications = [
      notifyUser({
        userId: complaint.userId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Complaint Escalated',
        message: `Your complaint ${complaint.complaintId} has been escalated to Emergency priority.`,
        type: 'ESCALATED',
      }),
    ];

    if (complaint.assignedWorkerId) {
      notifications.push(
        notifyUser({
          userId: complaint.assignedWorkerId,
          complaintId: complaint._id,
          complaintCode: complaint.complaintId,
          title: 'URGENT: Task Escalated',
          message: `Task ${complaint.complaintId} has been escalated by an official: ${complaint.escalationRemarks}`,
          type: 'ESCALATED',
        })
      );
    }

    await Promise.all(notifications);

    return res.status(200).json({
      success: true,
      message: 'Complaint escalated to Emergency priority.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const runSlaCheck = async (_req, res, next) => {
  try {
    const alertedCount = await checkAndNotifyOverdueComplaints();
    return res.status(200).json({
      success: true,
      alertedCount,
      message: `SLA check completed. ${alertedCount} overdue alert(s) dispatched.`,
    });
  } catch (error) {
    return next(error);
  }
};
