import mongoose from 'mongoose';
import { DEPARTMENTS, WORKER_AVAILABILITY } from '../constants/roles.js';

const workerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Worker name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Worker email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Worker phone number is required'],
      trim: true,
    },
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: [true, 'Department is required'],
      index: true,
    },
    assignedArea: {
      type: String,
      required: [true, 'Assigned working area is required'],
      trim: true,
      maxlength: 200,
    },
    availability: {
      type: String,
      enum: WORKER_AVAILABILITY,
      default: 'Available',
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

workerSchema.index({ department: 1, availability: 1, isActive: 1 });

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;
