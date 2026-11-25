import mongoose from 'mongoose';
import { ASSIGNMENT_STATUSES } from '../constants/roles.js';

const assignmentSchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workerProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: [true, 'Assignment deadline is required'],
      index: true,
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: '',
    },
    status: {
      type: String,
      enum: ASSIGNMENT_STATUSES,
      default: 'Assigned',
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    workerRemarks: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: '',
    },
    officialReviewRemarks: {
      type: String,
      trim: true,
      maxlength: 1500,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ workerId: 1, status: 1, createdAt: -1 });
assignmentSchema.index({ complaintId: 1, createdAt: -1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
export default Assignment;
