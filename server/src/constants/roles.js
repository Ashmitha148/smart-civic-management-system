export const ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official',
  WORKER: 'worker',
};

export const PUBLIC_REGISTRATION_ROLES = [ROLES.CITIZEN];

export const COMPLAINT_CATEGORIES = [
  'Road Damage',
  'Garbage Collection',
  'Water Leakage',
  'Drainage Problems',
  'Streetlight Issues',
  'Electricity Issues',
  'Sanitation',
  'Other',
];

export const DEPARTMENTS = [
  'Road Maintenance',
  'Sanitation',
  'Water Supply',
  'Electrical Maintenance',
  'Drainage',
  'General Maintenance',
];

export const CATEGORY_TO_DEPARTMENT = {
  'Road Damage': 'Road Maintenance',
  'Garbage Collection': 'Sanitation',
  Sanitation: 'Sanitation',
  'Water Leakage': 'Water Supply',
  'Drainage Problems': 'Drainage',
  'Streetlight Issues': 'Electrical Maintenance',
  'Electricity Issues': 'Electrical Maintenance',
  Other: 'General Maintenance',
};

export const COMPLAINT_STATUSES = [
  'Submitted',
  'Under Review',
  'Verified',
  'Assigned',
  'In Progress',
  'Resolved - Pending Verification',
  'Closed',
  'Rejected',
  'Reopened',
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Emergency', 'Critical'];

export const WORKER_AVAILABILITY = ['Available', 'Busy', 'On Leave', 'Unavailable'];

export const ASSIGNMENT_STATUSES = [
  'Assigned',
  'Accepted',
  'In Progress',
  'Submitted for Verification',
  'Approved',
  'Rejected',
  'Reassigned',
];

export const NOTIFICATION_TYPES = [
  'COMPLAINT_SUBMITTED',
  'COMPLAINT_VERIFIED',
  'COMPLAINT_REJECTED',
  'COMPLAINT_REOPENED',
  'STATUS_UPDATED',
  'WORKER_ASSIGNED',
  'TASK_ASSIGNED',
  'COMPLETION_SUBMITTED',
  'COMPLETION_APPROVED',
  'COMPLETION_REJECTED',
  'DEADLINE_ALERT',
  'ESCALATED',
  'OFFICIAL_REMARK',
  'SYSTEM',
];
