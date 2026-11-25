import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { ROLES } from '../constants/roles.js';

export const getPublicStats = async (_req, res, next) => {
  try {
    const [totalComplaints, resolvedComplaints, activeComplaints, registeredCitizens] =
      await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({
          status: { $in: ['Resolved - Pending Verification', 'Closed'] },
        }),
        Complaint.countDocuments({
          status: {
            $in: ['Submitted', 'Under Review', 'Verified', 'Assigned', 'In Progress', 'Reopened'],
          },
        }),
        User.countDocuments({ role: ROLES.CITIZEN }),
      ]);

    const resolutionRate =
      totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

    return res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        resolvedComplaints,
        activeComplaints,
        registeredCitizens,
        resolutionRate,
      },
    });
  } catch (error) {
    return next(error);
  }
};
