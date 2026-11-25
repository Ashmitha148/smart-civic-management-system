import crypto from 'crypto';
import Complaint from '../models/Complaint.js';

export const generateComplaintId = async () => {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const randomPart = crypto.randomInt(100000, 999999);
    const candidate = `SCMS-${year}-${randomPart}`;
    const existing = await Complaint.exists({ complaintId: candidate });
    if (!existing) {
      return candidate;
    }
  }

  const fallbackSuffix = Date.now().toString().slice(-6);
  return `SCMS-${year}-${fallbackSuffix}`;
};
