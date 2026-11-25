import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';
import { getIO } from '../config/socket.js';

export const notifyUser = async ({
  userId,
  complaintId = null,
  complaintCode = null,
  title,
  message,
  type = 'SYSTEM',
}) => {
  const notification = await Notification.create({
    userId,
    complaintId,
    complaintCode,
    title,
    message,
    type,
  });

  const io = getIO();
  if (io) {
    io.to(`user:${userId.toString()}`).emit('notification:new', notification);
  }

  return notification;
};

export const notifyOfficials = async ({
  complaintId = null,
  complaintCode = null,
  title,
  message,
  type = 'SYSTEM',
}) => {
  const officials = await User.find({ role: ROLES.OFFICIAL, isActive: true }).select('_id');
  if (!officials.length) return [];

  const notifications = await Promise.all(
    officials.map((official) =>
      notifyUser({
        userId: official._id,
        complaintId,
        complaintCode,
        title,
        message,
        type,
      })
    )
  );

  return notifications;
};
