import Complaint from '../models/Complaint.js';
import { notifyOfficials, notifyUser } from './notify.js';

export const computeSlaStatus = (deadline, status, now = new Date()) => {
  if (['Closed', 'Rejected'].includes(status)) {
    return {
      state: 'Completed',
      isOverdue: false,
      remainingMs: 0,
      remainingHours: 0,
      overdueHours: 0,
    };
  }

  if (!deadline) {
    return {
      state: 'No Deadline',
      isOverdue: false,
      remainingMs: null,
      remainingHours: null,
      overdueHours: 0,
    };
  }

  const deadlineMs = new Date(deadline).getTime();
  const nowMs = now.getTime();
  const remainingMs = deadlineMs - nowMs;

  if (remainingMs < 0) {
    return {
      state: 'Overdue',
      isOverdue: true,
      remainingMs,
      remainingHours: 0,
      overdueHours: Math.max(1, Math.round(Math.abs(remainingMs) / 3600000)),
    };
  }

  const remainingHours = Math.max(1, Math.ceil(remainingMs / 3600000));
  return {
    state: remainingHours <= 24 ? 'Due Soon' : 'On Track',
    isOverdue: false,
    remainingMs,
    remainingHours,
    overdueHours: 0,
  };
};

export const checkAndNotifyOverdueComplaints = async () => {
  const now = new Date();
  const overdueComplaints = await Complaint.find({
    deadline: { $ne: null, $lt: now },
    status: { $nin: ['Closed', 'Rejected'] },
    slaAlertSent: { $ne: true },
  });

  for (const complaint of overdueComplaints) {
    complaint.slaAlertSent = true;
    await complaint.save();

    await notifyOfficials({
      complaintId: complaint._id,
      complaintCode: complaint.complaintId,
      title: 'SLA Deadline Overdue',
      message: `Complaint ${complaint.complaintId} ("${complaint.title}") has passed its SLA deadline.`,
      type: 'DEADLINE_ALERT',
    });

    if (complaint.assignedWorkerId) {
      await notifyUser({
        userId: complaint.assignedWorkerId,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Task Deadline Overdue',
        message: `Assigned task ${complaint.complaintId} is overdue. Please update progress or submit completion.`,
        type: 'DEADLINE_ALERT',
      });
    }
  }

  return overdueComplaints.length;
};
