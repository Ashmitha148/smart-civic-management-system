import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import StatusHistory from '../models/StatusHistory.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Worker from '../models/Worker.js';
import Assignment from '../models/Assignment.js';
import {
  CATEGORY_TO_DEPARTMENT,
  COMPLAINT_PRIORITIES,
  DEPARTMENTS,
  ROLES,
  WORKER_AVAILABILITY,
} from '../constants/roles.js';
import { notifyUser } from '../utils/notify.js';

export const getAdminDashboard = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      total,
      submitted,
      awaitingVerification,
      assigned,
      ongoing,
      resolved,
      rejected,
      overdue,
      categoryStats,
      priorityStats,
      recentActivity,
      notifications,
      unreadNotificationCount,
    ] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: 'Submitted' }),
      Complaint.countDocuments({
        status: { $in: ['Submitted', 'Under Review', 'Reopened'] },
      }),
      Complaint.countDocuments({ status: 'Assigned' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({
        status: { $in: ['Resolved - Pending Verification', 'Closed'] },
      }),
      Complaint.countDocuments({ status: 'Rejected' }),
      Complaint.countDocuments({
        deadline: { $ne: null, $lt: now },
        status: { $nin: ['Closed', 'Rejected'] },
      }),
      Complaint.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Complaint.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      StatusHistory.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('complaintId', 'complaintId title status')
        .populate('updatedBy', 'name role')
        .lean(),
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Notification.countDocuments({ userId: req.user._id, isRead: false }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        submitted,
        awaitingVerification,
        assigned,
        ongoing,
        resolved,
        rejected,
        overdue,
      },
      categoryStats: categoryStats.map((c) => ({ category: c._id, count: c.count })),
      priorityStats: priorityStats.map((p) => ({ priority: p._id, count: p.count })),
      recentActivity,
      notifications,
      unreadNotificationCount,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAllComplaints = async (req, res, next) => {
  try {
    const { status, category, priority, search, overdue } = req.query;
    const filter = {};

    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (priority && priority !== 'All') filter.priority = priority;
    if (overdue === 'true') {
      filter.deadline = { $ne: null, $lt: new Date() };
      filter.status = { $nin: ['Closed', 'Rejected'] };
    }
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { complaintId: { $regex: escaped, $options: 'i' } },
        { 'location.address': { $regex: escaped, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter)
      .populate('userId', 'name email phone')
      .populate('assignedWorkerId', 'name email phone department employeeId')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { complaintId: id.toUpperCase() };

    const complaint = await Complaint.findOne(query)
      .populate('userId', 'name email phone address')
      .populate('assignedWorkerId', 'name email phone department employeeId')
      .populate('assignedByOfficialId', 'name email')
      .populate('verifiedBy', 'name email')
      .lean();

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const expectedDepartment =
      CATEGORY_TO_DEPARTMENT[complaint.category] || 'General Maintenance';

    const [statusHistory, assignments, eligibleWorkers] = await Promise.all([
      StatusHistory.find({ complaintId: complaint._id })
        .populate('updatedBy', 'name role')
        .sort({ createdAt: 1 })
        .lean(),
      Assignment.find({ complaintId: complaint._id })
        .populate('workerId', 'name email phone department employeeId')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean(),
      Worker.find({
        isActive: true,
        availability: 'Available',
      })
        .sort({ department: 1, name: 1 })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      complaint,
      expectedDepartment,
      statusHistory,
      assignments,
      eligibleWorkers,
    });
  } catch (error) {
    return next(error);
  }
};

export const verifyComplaint = async (req, res, next) => {
  try {
    const { remarks, priority } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (!['Submitted', 'Under Review', 'Reopened'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot verify a complaint currently in "${complaint.status}" status.`,
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'Verified';
    complaint.verifiedBy = req.user._id;
    complaint.verifiedAt = new Date();
    if (remarks && remarks.trim()) {
      complaint.officialRemarks = remarks.trim();
    }
    if (priority && COMPLAINT_PRIORITIES.includes(priority)) {
      complaint.priority = priority;
    }

    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Verified',
      remarks: remarks?.trim() || 'Complaint verified by municipal official.',
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await notifyUser({
      userId: complaint.userId,
      complaintId: complaint._id,
      complaintCode: complaint.complaintId,
      title: 'Complaint Verified',
      message: `Your complaint ${complaint.complaintId} has been verified and is queued for worker assignment.`,
      type: 'COMPLAINT_VERIFIED',
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint verified successfully.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectComplaint = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Administrative remarks are required when rejecting a complaint.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (['Closed', 'Rejected'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Complaint is already "${complaint.status}".`,
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'Rejected';
    complaint.rejectionReason = remarks.trim();
    complaint.officialRemarks = remarks.trim();
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Rejected',
      remarks: remarks.trim(),
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await notifyUser({
      userId: complaint.userId,
      complaintId: complaint._id,
      complaintCode: complaint.complaintId,
      title: 'Complaint Rejected',
      message: `Your complaint ${complaint.complaintId} was rejected: ${remarks.trim()}`,
      type: 'COMPLAINT_REJECTED',
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint rejected.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateComplaintPriority = async (req, res, next) => {
  try {
    const { priority, remarks } = req.body;
    if (!COMPLAINT_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const oldPriority = complaint.priority;
    complaint.priority = priority;
    if (remarks && remarks.trim()) {
      complaint.officialRemarks = remarks.trim();
    }
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: complaint.status,
      status: complaint.status,
      remarks:
        remarks?.trim() || `Priority updated from ${oldPriority} to ${priority}.`,
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    return res.status(200).json({
      success: true,
      message: `Priority updated to ${priority}.`,
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const assignWorker = async (req, res, next) => {
  try {
    const { complaintId, workerId, deadline, instructions } = req.body;

    if (!complaintId || !workerId || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Complaint ID, worker selection, and deadline are required.',
      });
    }

    const parsedDeadline = new Date(deadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid deadline date.',
      });
    }

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (!['Verified', 'Reopened', 'Assigned'].includes(complaint.status)) {
      return res.status(400).json({
        success: false,
        message: `Complaint must be Verified or Reopened before assignment (current status: "${complaint.status}").`,
      });
    }

    const workerProfile = await Worker.findOne({
      $or: [{ userId: workerId }, { _id: mongoose.Types.ObjectId.isValid(workerId) ? workerId : null }],
    });

    if (!workerProfile || !workerProfile.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Selected municipal worker not found or inactive.',
      });
    }

    if (workerProfile.availability !== 'Available') {
      return res.status(400).json({
        success: false,
        message: `Worker ${workerProfile.name} is currently "${workerProfile.availability}" and cannot be assigned.`,
      });
    }

    if (complaint.currentAssignmentId) {
      await Assignment.findByIdAndUpdate(complaint.currentAssignmentId, {
        status: 'Reassigned',
      });
    }

    const assignment = await Assignment.create({
      complaintId: complaint._id,
      workerId: workerProfile.userId,
      workerProfileId: workerProfile._id,
      assignedBy: req.user._id,
      deadline: parsedDeadline,
      instructions: instructions?.trim() || '',
      status: 'Assigned',
    });

    const previousStatus = complaint.status;
    complaint.status = 'Assigned';
    complaint.assignedWorkerId = workerProfile.userId;
    complaint.assignedByOfficialId = req.user._id;
    complaint.assignedDepartment = workerProfile.department;
    complaint.currentAssignmentId = assignment._id;
    complaint.deadline = parsedDeadline;
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Assigned',
      remarks: `Assigned to ${workerProfile.name} (${workerProfile.department}). Deadline: ${parsedDeadline.toLocaleDateString()}.`,
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await Promise.all([
      notifyUser({
        userId: workerProfile.userId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'New Task Assigned',
        message: `You have been assigned complaint ${complaint.complaintId} ("${complaint.title}"). Deadline: ${parsedDeadline.toLocaleDateString()}.`,
        type: 'TASK_ASSIGNED',
      }),
      notifyUser({
        userId: complaint.userId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Worker Assigned',
        message: `Municipal worker ${workerProfile.name} (${workerProfile.department}) has been assigned to your complaint ${complaint.complaintId}.`,
        type: 'WORKER_ASSIGNED',
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Worker assigned successfully.',
      assignment,
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const approveCompletion = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.status !== 'Resolved - Pending Verification') {
      return res.status(400).json({
        success: false,
        message: 'Only complaints in "Resolved - Pending Verification" status can be approved and closed.',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'Closed';
    complaint.resolvedAt = new Date();
    if (remarks && remarks.trim()) {
      complaint.officialRemarks = remarks.trim();
    }
    await complaint.save();

    if (complaint.currentAssignmentId) {
      await Assignment.findByIdAndUpdate(complaint.currentAssignmentId, {
        status: 'Approved',
        reviewedAt: new Date(),
        officialReviewRemarks: remarks?.trim() || 'Work verified and approved.',
      });
    }

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Closed',
      remarks: remarks?.trim() || 'Completion evidence verified and complaint closed.',
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    const notifications = [
      notifyUser({
        userId: complaint.userId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Complaint Closed',
        message: `Your complaint ${complaint.complaintId} has been verified as resolved and closed.`,
        type: 'COMPLETION_APPROVED',
      }),
    ];

    if (complaint.assignedWorkerId) {
      notifications.push(
        notifyUser({
          userId: complaint.assignedWorkerId,
          complaintId: complaint._id,
          complaintCode: complaint.complaintId,
          title: 'Completion Approved',
          message: `Your completion submission for ${complaint.complaintId} was approved.`,
          type: 'COMPLETION_APPROVED',
        })
      );
    }

    await Promise.all(notifications);

    return res.status(200).json({
      success: true,
      message: 'Completion approved and complaint closed.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const rejectCompletion = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    if (!remarks || !remarks.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Remarks explaining why the work is unsatisfactory are required.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.status !== 'Resolved - Pending Verification') {
      return res.status(400).json({
        success: false,
        message: 'Only complaints awaiting completion verification can be rejected.',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'Reopened';
    complaint.officialRemarks = remarks.trim();
    await complaint.save();

    if (complaint.currentAssignmentId) {
      await Assignment.findByIdAndUpdate(complaint.currentAssignmentId, {
        status: 'Rejected',
        reviewedAt: new Date(),
        officialReviewRemarks: remarks.trim(),
      });
    }

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Reopened',
      remarks: `Completion rejected by official: ${remarks.trim()}`,
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    const notifications = [
      notifyUser({
        userId: complaint.userId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Complaint Reopened for Rework',
        message: `Complaint ${complaint.complaintId} was reopened for additional municipal work.`,
        type: 'STATUS_UPDATED',
      }),
    ];

    if (complaint.assignedWorkerId) {
      notifications.push(
        notifyUser({
          userId: complaint.assignedWorkerId,
          complaintId: complaint._id,
          complaintCode: complaint.complaintId,
          title: 'Completion Rejected — Rework Required',
          message: `Official rejected completion for ${complaint.complaintId}: ${remarks.trim()}`,
          type: 'COMPLETION_REJECTED',
        })
      );
    }

    await Promise.all(notifications);

    return res.status(200).json({
      success: true,
      message: 'Completion rejected and complaint reopened.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

// --- Worker Management ---

export const getWorkers = async (req, res, next) => {
  try {
    const { department, availability, search } = req.query;
    const filter = {};
    if (department && department !== 'All') filter.department = department;
    if (availability && availability !== 'All') filter.availability = availability;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
        { assignedArea: { $regex: escaped, $options: 'i' } },
        { employeeId: { $regex: escaped, $options: 'i' } },
      ];
    }

    const workers = await Worker.find(filter).sort({ createdAt: -1 }).lean();

    const taskStats = await Assignment.aggregate([
      {
        $group: {
          _id: '$workerId',
          totalTasks: { $sum: 1 },
          activeTasks: {
            $sum: {
              $cond: [
                { $in: ['$status', ['Assigned', 'Accepted', 'In Progress']] },
                1,
                0,
              ],
            },
          },
          completedTasks: {
            $sum: { $cond: [{ $eq: ['$status', 'Approved'] }, 1, 0] },
          },
        },
      },
    ]);

    const statsMap = new Map(taskStats.map((s) => [s._id.toString(), s]));
    const enriched = workers.map((w) => {
      const s = statsMap.get(w.userId.toString()) || {
        totalTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
      };
      return { ...w, performance: s };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      workers: enriched,
    });
  } catch (error) {
    return next(error);
  }
};

export const createWorker = async (req, res, next) => {
  try {
    const { name, email, phone, password, department, assignedArea, employeeId } =
      req.body;

    if (!name || !email || !phone || !password || !department || !assignedArea) {
      return res.status(400).json({
        success: false,
        message:
          'Name, email, phone, password, department, and assigned area are required.',
      });
    }

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    const generatedEmpId =
      employeeId?.trim() || `MUN-${Date.now().toString().slice(-6)}`;

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      address: assignedArea.trim(),
      role: ROLES.WORKER,
      department,
      employeeId: generatedEmpId,
    });

    const worker = await Worker.create({
      userId: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      employeeId: generatedEmpId,
      department,
      assignedArea: assignedArea.trim(),
      availability: 'Available',
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Municipal worker registered successfully.',
      worker,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateWorker = async (req, res, next) => {
  try {
    const { name, phone, department, assignedArea, availability, isActive } = req.body;
    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    if (department && !DEPARTMENTS.includes(department)) {
      return res.status(400).json({ success: false, message: 'Invalid department.' });
    }
    if (availability && !WORKER_AVAILABILITY.includes(availability)) {
      return res.status(400).json({ success: false, message: 'Invalid availability.' });
    }

    if (name) worker.name = name.trim();
    if (phone) worker.phone = phone.trim();
    if (department) worker.department = department;
    if (assignedArea) worker.assignedArea = assignedArea.trim();
    if (availability) worker.availability = availability;
    if (typeof isActive === 'boolean') worker.isActive = isActive;

    await worker.save();

    await User.findByIdAndUpdate(worker.userId, {
      name: worker.name,
      phone: worker.phone,
      department: worker.department,
      address: worker.assignedArea,
      isActive: worker.isActive,
    });

    return res.status(200).json({
      success: true,
      message: 'Worker profile updated.',
      worker,
    });
  } catch (error) {
    return next(error);
  }
};

export const getWorkerDetails = async (req, res, next) => {
  try {
    const worker = await Worker.findById(req.params.id).lean();
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    const assignments = await Assignment.find({ workerId: worker.userId })
      .populate('complaintId', 'complaintId title category priority status deadline')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      worker,
      assignments,
    });
  } catch (error) {
    return next(error);
  }
};
