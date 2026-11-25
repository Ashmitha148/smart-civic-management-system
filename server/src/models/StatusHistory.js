import mongoose from 'mongoose';
import { COMPLAINT_STATUSES, ROLES } from '../constants/roles.js';

const statusHistorySchema = new mongoose.Schema(
  {
    complaintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Complaint',
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      enum: [...COMPLAINT_STATUSES, null],
      default: null,
    },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedByRole: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

statusHistorySchema.index({ complaintId: 1, createdAt: 1 });

const StatusHistory = mongoose.model('StatusHistory', statusHistorySchema);
export default StatusHistory;
