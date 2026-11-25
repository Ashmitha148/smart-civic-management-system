import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import StatusHistory from '../models/StatusHistory.js';
import Notification from '../models/Notification.js';
import Worker from '../models/Worker.js';
import { uploadComplaintImages } from '../utils/uploadToCloudinary.js';
import { notifyOfficials, notifyUser } from '../utils/notify.js';

export const getWorkerDashboard = async (req, res, next) => {
  try {
    const workerId = req.user._id;
    const now = new Date();

    const [
      totalAssigned,
      pendingTasks,
      ongoingTasks,
      completedTasks,
      overdueTasks,
      recentTasks,
      notifications,
      unreadNotificationCount,
      workerProfile,
    ] = await Promise.all([
      Complaint.countDocuments({ assignedWorkerId: workerId }),
      Complaint.countDocuments({ assignedWorkerId: workerId, status: 'Assigned' }),
      Complaint.countDocuments({
        assignedWorkerId: workerId,
        status: { $in: ['In Progress', 'Reopened'] },
      }),
      Complaint.countDocuments({
        assignedWorkerId: workerId,
        status: { $in: ['Resolved - Pending Verification', 'Closed'] },
      }),
      Complaint.countDocuments({
        assignedWorkerId: workerId,
        deadline: { $ne: null, $lt: now },
        status: { $nin: ['Resolved - Pending Verification', 'Closed', 'Rejected'] },
      }),
      Complaint.find({ assignedWorkerId: workerId })
        .sort({ deadline: 1, updatedAt: -1 })
        .limit(5)
        .lean(),
      Notification.find({ userId: workerId }).sort({ createdAt: -1 }).limit(10).lean(),
      Notification.countDocuments({ userId: workerId, isRead: false }),
      Worker.findOne({ userId: workerId }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      workerProfile,
      stats: {
        total: totalAssigned,
        pending: pendingTasks,
        ongoing: ongoingTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },
      recentTasks,
      notifications,
      unreadNotificationCount,
    });
  } catch (error) {
    return next(error);
  }
};

export const getWorkerTasks = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = { assignedWorkerId: req.user._id };

    if (status && status !== 'All') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { complaintId: { $regex: escaped, $options: 'i' } },
        { 'location.address': { $regex: escaped, $options: 'i' } },
      ];
    }

    const tasks = await Complaint.find(filter)
      .populate('currentAssignmentId')
      .populate('userId', 'name phone')
      .sort({ deadline: 1, updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    return next(error);
  }
};

export const getWorkerTaskById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'name phone')
      .populate('currentAssignmentId')
      .lean();

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (
      !complaint.assignedWorkerId ||
      complaint.assignedWorkerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view complaints assigned to you.',
      });
    }

    const [statusHistory, assignments] = await Promise.all([
      StatusHistory.find({ complaintId: complaint._id })
        .populate('updatedBy', 'name role')
        .sort({ createdAt: 1 })
        .lean(),
      Assignment.find({ complaintId: complaint._id, workerId: req.user._id })
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      task: complaint,
      statusHistory,
      assignments,
    });
  } catch (error) {
    return next(error);
  }
};

export const acceptTask = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (
      !complaint.assignedWorkerId ||
      complaint.assignedWorkerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This task is not assigned to you.',
      });
    }

    if (complaint.currentAssignmentId) {
      await Assignment.findByIdAndUpdate(complaint.currentAssignmentId, {
        status: 'Accepted',
        acceptedAt: new Date(),
      });
    }

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: complaint.status,
      status: complaint.status,
      remarks: `Task accepted by municipal worker ${req.user.name}.`,
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    return res.status(200).json({
      success: true,
      message: 'Task accepted successfully.',
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    if (status === 'Closed') {
      return res.status(403).json({
        success: false,
        message:
          'Municipal workers are not permitted to close complaints directly. Submit completion evidence for official verification.',
      });
    }

    if (status && status !== 'In Progress') {
      return res.status(400).json({
        success: false,
        message: 'Workers can only update active task status to "In Progress".',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (
      !complaint.assignedWorkerId ||
      complaint.assignedWorkerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This task is not assigned to you.',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'In Progress';
    await complaint.save();

    if (complaint.currentAssignmentId) {
      await Assignment.findByIdAndUpdate(complaint.currentAssignmentId, {
        status: 'In Progress',
        startedAt: new Date(),
        ...(remarks?.trim() ? { workerRemarks: remarks.trim() } : {}),
      });
    }

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'In Progress',
      remarks: remarks?.trim() || 'Field work is now in progress.',
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await notifyUser({
      userId: complaint.userId,
      complaintId: complaint._id,
      complaintCode: complaint.complaintId,
      title: 'Work In Progress',
      message: `Municipal worker ${req.user.name} has started work on complaint ${complaint.complaintId}.`,
      type: 'STATUS_UPDATED',
    });

    return res.status(200).json({
      success: true,
      message: 'Task status updated to In Progress.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const completeTask = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Task not found.' });
    }

    if (
      !complaint.assignedWorkerId ||
      complaint.assignedWorkerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This task is not assigned to you.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one completion photograph as evidence.',
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedCompletionImages = await uploadComplaintImages(req.files, baseUrl);

    const previousStatus = complaint.status;
    complaint.status = 'Resolved - Pending Verification';
    complaint.completionImages = [
      ...(complaint.completionImages || []),
      ...uploadedCompletionImages,
    ].slice(-5);
    complaint.resolutionNotes = remarks?.trim() || 'Work completed by municipal worker.';
    await complaint.save();

    if (complaint.currentAssignmentId) {
      await Assignment.findByIdAndUpdate(complaint.currentAssignmentId, {
        status: 'Submitted for Verification',
        completedAt: new Date(),
        workerRemarks: remarks?.trim() || 'Completion evidence uploaded.',
      });
    }

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Resolved - Pending Verification',
      remarks:
        remarks?.trim() ||
        'Worker uploaded completion photographs and submitted for official verification.',
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await Promise.all([
      notifyOfficials({
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Completion Evidence Submitted',
        message: `Worker ${req.user.name} submitted completion photos for ${complaint.complaintId} ("${complaint.title}").`,
        type: 'COMPLETION_SUBMITTED',
      }),
      notifyUser({
        userId: complaint.userId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Work Completed — Pending Verification',
        message: `Field work on ${complaint.complaintId} is complete and awaiting official verification.`,
        type: 'STATUS_UPDATED',
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Completion evidence submitted for official verification.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};
