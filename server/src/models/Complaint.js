import mongoose from 'mongoose';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} from '../constants/roles.js';

const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: '',
    },
    originalName: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    address: {
      type: String,
      required: [true, 'Location address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    landmark: {
      type: String,
      trim: true,
      maxlength: [150, 'Landmark cannot exceed 150 characters'],
      default: '',
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
      default: null,
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
      default: null,
    },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Complaint title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Detailed description is required'],
      trim: true,
      minlength: [15, 'Description must be at least 15 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      enum: COMPLAINT_CATEGORIES,
      required: [true, 'Complaint category is required'],
      index: true,
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: {
        validator(val) {
          return val.length <= 5;
        },
        message: 'You can upload up to 5 images per complaint',
      },
    },
    completionImages: {
      type: [imageSchema],
      default: [],
      validate: {
        validator(val) {
          return val.length <= 5;
        },
        message: 'You can upload up to 5 completion images per complaint',
      },
    },
    location: {
      type: locationSchema,
      required: true,
    },
    priority: {
      type: String,
      enum: COMPLAINT_PRIORITIES,
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: 'Submitted',
      index: true,
    },
    // Phase 2: Official & Municipal Worker workflow fields
    assignedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    assignedByOfficialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedDepartment: {
      type: String,
      trim: true,
      default: null,
    },
    currentAssignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
    },
    deadline: {
      type: Date,
      default: null,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    officialRemarks: {
      type: String,
      trim: true,
      default: '',
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    resolutionNotes: {
      type: String,
      trim: true,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    // Phase 3: Smart priority, duplicate detection, SLA, escalation & reopen
    suggestedPriority: {
      type: String,
      enum: COMPLAINT_PRIORITIES,
      default: 'Medium',
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    priorityFactors: {
      type: [String],
      default: [],
    },
    isPotentialDuplicate: {
      type: Boolean,
      default: false,
      index: true,
    },
    potentialDuplicates: {
      type: [
        {
          complaintId: String,
          title: String,
          similarityScore: Number,
          distanceMeters: Number,
        },
      ],
      default: [],
    },
    slaAlertSent: {
      type: Boolean,
      default: false,
    },
    isEscalated: {
      type: Boolean,
      default: false,
      index: true,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    escalationRemarks: {
      type: String,
      trim: true,
      default: '',
    },
    reopenCount: {
      type: Number,
      default: 0,
    },
    reopenReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, category: 1 });
complaintSchema.index({ assignedWorkerId: 1, status: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
