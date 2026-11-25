export const ROLES = {
  CITIZEN: 'citizen',
  OFFICIAL: 'official',
  WORKER: 'worker',
};

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

export const WORKER_AVAILABILITY = ['Available', 'Busy', 'On Leave', 'Unavailable'];

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

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Emergency'];

export const STATUS_STYLES = {
  Submitted: 'bg-sky-50 text-sky-700 border-sky-200',
  'Under Review': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Verified: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  Assigned: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-orange-50 text-orange-700 border-orange-200',
  'Resolved - Pending Verification': 'bg-teal-50 text-teal-700 border-teal-200',
  Closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
  Reopened: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const PRIORITY_STYLES = {
  Low: 'bg-slate-100 text-slate-700 border-slate-200',
  Medium: 'bg-blue-50 text-blue-700 border-blue-200',
  High: 'bg-amber-50 text-amber-700 border-amber-200',
  Emergency: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
  Critical: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
};
