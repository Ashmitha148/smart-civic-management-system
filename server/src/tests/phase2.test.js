import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase2_test_secret';
process.env.NODE_ENV = 'test';

import app from '../app.js';
import User from '../models/User.js';
import Worker from '../models/Worker.js';
import Complaint from '../models/Complaint.js';
import Assignment from '../models/Assignment.js';
import StatusHistory from '../models/StatusHistory.js';
import Notification from '../models/Notification.js';
import { ROLES } from '../constants/roles.js';

const citizenId = new mongoose.Types.ObjectId();
const officialId = new mongoose.Types.ObjectId();
const worker1Id = new mongoose.Types.ObjectId();
const worker2Id = new mongoose.Types.ObjectId();
const worker1ProfileId = new mongoose.Types.ObjectId();
const complaintObjectId = new mongoose.Types.ObjectId();

const citizenUser = {
  _id: citizenId,
  name: 'Test Citizen',
  email: 'citizen@test.local',
  role: ROLES.CITIZEN,
  isActive: true,
};
const officialUser = {
  _id: officialId,
  name: 'Test Official',
  email: 'official@test.local',
  role: ROLES.OFFICIAL,
  isActive: true,
};
const worker1User = {
  _id: worker1Id,
  name: 'Worker One',
  email: 'worker1@test.local',
  role: ROLES.WORKER,
  isActive: true,
};
const worker2User = {
  _id: worker2Id,
  name: 'Worker Two',
  email: 'worker2@test.local',
  role: ROLES.WORKER,
  isActive: true,
};

const usersById = new Map([
  [citizenId.toString(), citizenUser],
  [officialId.toString(), officialUser],
  [worker1Id.toString(), worker1User],
  [worker2Id.toString(), worker2User],
]);

// Stateful in-memory records for testing controller flows without external DB
let complaintDoc = {
  _id: complaintObjectId,
  complaintId: 'SCMS-2026-888888',
  userId: citizenId,
  title: 'Damaged road culvert',
  description: 'Culvert slab cracked on 5th Avenue.',
  category: 'Road Damage',
  priority: 'Medium',
  status: 'Submitted',
  assignedWorkerId: null,
  currentAssignmentId: null,
  images: [{ url: 'http://localhost/before.jpg' }],
  completionImages: [],
  save: async function save() {
    return this;
  },
};

const worker1Profile = {
  _id: worker1ProfileId,
  userId: worker1Id,
  name: 'Worker One',
  department: 'Road Maintenance',
  availability: 'Available',
  isActive: true,
};

const statusHistoryLog = [];
const notificationsLog = [];
const assignmentsLog = [];

// Stub Mongoose model methods used by authMiddleware and controllers
User.findById = (id) => ({
  select: async () => usersById.get(id.toString()) || null,
});
User.find = () => ({
  select: async () => [officialUser],
});

Complaint.findById = async (id) => {
  if (id.toString() === complaintObjectId.toString()) {
    return complaintDoc;
  }
  return null;
};

Worker.findOne = async () => worker1Profile;

Assignment.create = async (payload) => {
  const doc = { _id: new mongoose.Types.ObjectId(), ...payload };
  assignmentsLog.push(doc);
  return doc;
};
Assignment.findByIdAndUpdate = async (id, update) => {
  const found = assignmentsLog.find((a) => a._id.toString() === id.toString());
  if (found) Object.assign(found, update);
  return found;
};
Assignment.find = () => ({
  populate: () => ({
    sort: () => ({
      lean: async () => assignmentsLog,
    }),
  }),
});

StatusHistory.create = async (payload) => {
  statusHistoryLog.push(payload);
  return payload;
};
StatusHistory.find = () => ({
  populate: () => ({
    sort: () => ({
      lean: async () => statusHistoryLog,
    }),
  }),
});

Notification.create = async (payload) => {
  notificationsLog.push(payload);
  return payload;
};

const sign = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET);

const citizenToken = sign(citizenUser);
const officialToken = sign(officialUser);
const worker1Token = sign(worker1User);
const worker2Token = sign(worker2User);

const runTests = async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  try {
    // 1. Citizens cannot access Admin dashboard
    const res1 = await fetch(`${baseUrl}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    assert.strictEqual(res1.status, 403, 'Citizen must receive 403 on /admin/dashboard');
    console.log('PASS: 1. Citizens cannot access Admin dashboard (403)');

    // 2. Officials can verify complaints
    const res2 = await fetch(`${baseUrl}/admin/complaints/${complaintObjectId}/verify`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${officialToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ remarks: 'Verified by inspector', priority: 'High' }),
    });
    assert.strictEqual(res2.status, 200, 'Official should verify complaint');
    assert.strictEqual(complaintDoc.status, 'Verified');
    assert.strictEqual(complaintDoc.priority, 'High');
    console.log('PASS: 2. Officials can verify complaints (Submitted -> Verified)');

    // 3. Officials can assign workers
    const res3 = await fetch(`${baseUrl}/admin/assignments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${officialToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        complaintId: complaintObjectId.toString(),
        workerId: worker1Id.toString(),
        deadline: new Date(Date.now() + 86400000).toISOString(),
        instructions: 'Repair culvert immediately.',
      }),
    });
    assert.strictEqual(res3.status, 201, 'Official should assign worker');
    assert.strictEqual(complaintDoc.status, 'Assigned');
    assert.strictEqual(complaintDoc.assignedWorkerId.toString(), worker1Id.toString());
    console.log('PASS: 3. Officials can assign available workers (Verified -> Assigned)');

    // 4. Workers cannot access other workers' assignments
    const res4 = await fetch(`${baseUrl}/worker/tasks/${complaintObjectId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${worker2Token}` },
    });
    assert.strictEqual(res4.status, 403, 'Other worker must receive 403');
    console.log('PASS: 4. Workers cannot access other workers assignments (403)');

    // 5. Assigned worker can update task status to In Progress
    const res5 = await fetch(`${baseUrl}/worker/tasks/${complaintObjectId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${worker1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'In Progress', remarks: 'Started culvert repair.' }),
    });
    assert.strictEqual(res5.status, 200, 'Assigned worker should update status');
    assert.strictEqual(complaintDoc.status, 'In Progress');
    console.log('PASS: 5. Workers can update assigned tasks to In Progress');

    // 6. Workers cannot close complaints directly
    const res6 = await fetch(`${baseUrl}/worker/tasks/${complaintObjectId}/status`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${worker1Token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'Closed' }),
    });
    assert.strictEqual(res6.status, 403, 'Worker attempting to close must receive 403');
    console.log('PASS: 6. Workers cannot close complaints directly (403)');

    // 7. Officials can approve completion (simulate worker submitted completion evidence)
    complaintDoc.status = 'Resolved - Pending Verification';
    complaintDoc.completionImages = [{ url: 'http://localhost/after.jpg' }];
    const res7 = await fetch(
      `${baseUrl}/admin/complaints/${complaintObjectId}/approve-completion`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${officialToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ remarks: 'Before-and-after verified. Approved.' }),
      }
    );
    assert.strictEqual(res7.status, 200, 'Official should approve completion');
    assert.strictEqual(complaintDoc.status, 'Closed');
    console.log('PASS: 7. Officials can approve completion and close complaint');

    // 8. Citizens receive complaint updates via Notifications
    const citizenNotifications = notificationsLog.filter(
      (n) => n.userId.toString() === citizenId.toString()
    );
    assert.ok(
      citizenNotifications.length >= 4,
      'Citizen should have received notifications for verify, assign, progress, and closure'
    );
    console.log(
      `PASS: 8. Citizens receive complaint updates (${citizenNotifications.length} notifications recorded)`
    );

    console.log('\nALL_PHASE_2_WORKFLOW_TESTS_PASSED');
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
