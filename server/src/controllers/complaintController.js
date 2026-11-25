import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import StatusHistory from '../models/StatusHistory.js';
import Feedback from '../models/Feedback.js';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  ROLES,
} from '../constants/roles.js';
import { generateComplaintId } from '../utils/generateComplaintId.js';
import { uploadComplaintImages } from '../utils/uploadToCloudinary.js';
import { calculateSuggestedPriority } from '../utils/priorityEngine.js';
import { findPotentialDuplicates, haversineMeters } from '../utils/duplicateDetector.js';
import { computeSlaStatus } from '../utils/slaMonitor.js';
import { notifyOfficials, notifyUser } from '../utils/notify.js';

export const checkDuplicates = async (req, res, next) => {
  try {
    const { title, description, category, latitude, longitude } = req.body;
    if (!category) {
      return res.status(200).json({ success: true, duplicates: [] });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentComplaints = await Complaint.find({
      category,
      createdAt: { $gte: thirtyDaysAgo },
      status: { $nin: ['Rejected'] },
    })
      .select('complaintId title description category status location')
      .lean();

    const parsedLat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null;
    const parsedLng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null;

    const duplicates = findPotentialDuplicates(
      {
        title,
        description,
        category,
        latitude: parsedLat,
        longitude: parsedLng,
      },
      recentComplaints
    );

    return res.status(200).json({
      success: true,
      duplicates,
    });
  } catch (error) {
    return next(error);
  }
};

export const createComplaint = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      address,
      landmark,
      latitude,
      longitude,
      priority,
    } = req.body;

    if (!title || !description || !category || !address) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, category, and location address are required.',
      });
    }

    if (!COMPLAINT_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid complaint category selected.',
      });
    }

    const parsedLat =
      latitude !== undefined && latitude !== '' && latitude !== null
        ? Number(latitude)
        : null;
    const parsedLng =
      longitude !== undefined && longitude !== '' && longitude !== null
        ? Number(longitude)
        : null;

    if (
      (parsedLat !== null && Number.isNaN(parsedLat)) ||
      (parsedLng !== null && Number.isNaN(parsedLng))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude must be valid numbers.',
      });
    }

    const validPriority = COMPLAINT_PRIORITIES.includes(priority) ? priority : 'Medium';

    // Smart priority & duplicate detection
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSameCategory = await Complaint.find({
      category,
      createdAt: { $gte: thirtyDaysAgo },
      status: { $nin: ['Rejected'] },
    })
      .select('complaintId title description category status location')
      .lean();

    let nearbySimilarCount = 0;
    if (parsedLat !== null && parsedLng !== null) {
      nearbySimilarCount = recentSameCategory.filter(
        (c) =>
          typeof c.location?.latitude === 'number' &&
          typeof c.location?.longitude === 'number' &&
          haversineMeters(parsedLat, parsedLng, c.location.latitude, c.location.longitude) <=
            500
      ).length;
    }

    const prioritySuggestion = calculateSuggestedPriority({
      category,
      title: title.trim(),
      description: description.trim(),
      reportedSeverity: validPriority,
      nearbySimilarCount,
    });

    const potentialDuplicates = findPotentialDuplicates(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        latitude: parsedLat,
        longitude: parsedLng,
      },
      recentSameCategory
    );

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedImages = await uploadComplaintImages(req.files || [], baseUrl);
    const complaintId = await generateComplaintId();

    const complaint = await Complaint.create({
      complaintId,
      userId: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category,
      images: uploadedImages,
      location: {
        address: address.trim(),
        landmark: landmark ? landmark.trim() : '',
        latitude: parsedLat,
        longitude: parsedLng,
      },
      priority: validPriority,
      suggestedPriority: prioritySuggestion.suggestedPriority,
      priorityScore: prioritySuggestion.score,
      priorityFactors: prioritySuggestion.factors,
      isPotentialDuplicate: potentialDuplicates.length > 0,
      potentialDuplicates: potentialDuplicates.map((d) => ({
        complaintId: d.complaintId,
        title: d.title,
        similarityScore: d.similarityScore,
        distanceMeters: d.distanceMeters,
      })),
      status: 'Submitted',
    });

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus: null,
      status: 'Submitted',
      remarks: 'Complaint submitted by citizen and awaiting municipal review.',
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await Promise.all([
      notifyUser({
        userId: req.user._id,
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'Complaint Submitted',
        message: `Your complaint ${complaint.complaintId} ("${complaint.title}") has been registered.`,
        type: 'COMPLAINT_SUBMITTED',
      }),
      notifyOfficials({
        complaintId: complaint._id,
        complaintCode: complaint.complaintId,
        title: 'New Civic Complaint Filed',
        message: `${complaint.complaintId} (${complaint.category}, suggested priority: ${complaint.suggestedPriority}) submitted.`,
        type: 'COMPLAINT_SUBMITTED',
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyComplaints = async (req, res, next) => {
  try {
    const { status, category, search } = req.query;
    const filter = { userId: req.user._id };

    if (status && status !== 'All') filter.status = status;
    if (category && category !== 'All') filter.category = category;
    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { complaintId: { $regex: escaped, $options: 'i' } },
        { 'location.address': { $regex: escaped, $options: 'i' } },
      ];
    }

    const complaints = await Complaint.find(filter).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    return next(error);
  }
};

export const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { complaintId: id.toUpperCase() };

    const complaint = await Complaint.findOne(query)
      .populate('userId', 'name email phone')
      .populate('assignedWorkerId', 'name email phone department employeeId')
      .lean();

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const ownerId = complaint.userId?._id
      ? complaint.userId._id.toString()
      : complaint.userId.toString();

    if (req.user.role === ROLES.CITIZEN && ownerId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own complaints.',
      });
    }

    const [statusHistory, feedback] = await Promise.all([
      StatusHistory.find({ complaintId: complaint._id })
        .populate('updatedBy', 'name role')
        .sort({ createdAt: 1 })
        .lean(),
      Feedback.findOne({ complaintId: complaint._id }).lean(),
    ]);

    return res.status(200).json({
      success: true,
      complaint,
      statusHistory,
      feedback,
      sla: computeSlaStatus(complaint.deadline, complaint.status),
    });
  } catch (error) {
    return next(error);
  }
};

export const submitFeedback = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid rating between 1 and 5.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only rate your own complaints.',
      });
    }

    if (complaint.status !== 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Feedback can only be submitted after the complaint is officially closed.',
      });
    }

    const existingFeedback = await Feedback.findOne({ complaintId: complaint._id });
    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'Feedback has already been submitted for this complaint.',
      });
    }

    const feedback = await Feedback.create({
      complaintId: complaint._id,
      userId: req.user._id,
      rating: numericRating,
      comment: comment?.trim() || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you for your feedback.',
      feedback,
    });
  } catch (error) {
    return next(error);
  }
};

export const reopenComplaint = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a clear reason (at least 5 characters) for reopening.',
      });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    if (complaint.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only reopen your own complaints.',
      });
    }

    if (complaint.status !== 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Only closed complaints can be reopened by citizens.',
      });
    }

    const previousStatus = complaint.status;
    complaint.status = 'Reopened';
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;
    complaint.reopenReason = reason.trim();
    complaint.slaAlertSent = false;
    await complaint.save();

    await StatusHistory.create({
      complaintId: complaint._id,
      previousStatus,
      status: 'Reopened',
      remarks: `Reopened by citizen: ${reason.trim()}`,
      updatedBy: req.user._id,
      updatedByRole: req.user.role,
    });

    await notifyOfficials({
      complaintId: complaint._id,
      complaintCode: complaint.complaintId,
      title: 'Complaint Reopened by Citizen',
      message: `${complaint.complaintId} was reopened: ${reason.trim()}`,
      type: 'COMPLAINT_REOPENED',
    });

    return res.status(200).json({
      success: true,
      message: 'Complaint reopened and municipal officials notified.',
      complaint,
    });
  } catch (error) {
    return next(error);
  }
};
