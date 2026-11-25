import assert from 'assert';
import http from 'http';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase3_test_secret';
process.env.NODE_ENV = 'test';

import app from '../app.js';
import User from '../models/User.js';
import Complaint from '../models/Complaint.js';
import Feedback from '../models/Feedback.js';
import StatusHistory from '../models/StatusHistory.js';
import Notification from '../models/Notification.js';
import { ROLES } from '../constants/roles.js';
import { calculateSuggestedPriority } from '../utils/priorityEngine.js';
import {
  computeTextSimilarity,
  findPotentialDuplicates,
  haversineMeters,
} from '../utils/duplicateDetector.js';
import { computeSlaStatus } from '../utils/slaMonitor.js';

const results = [];
const record = (id, scenario, actual, pass = true) => {
  results.push({ id, scenario, actual, status: pass ? 'PASS' : 'FAIL' });
  console.log(`${pass ? 'PASS' : 'FAIL'} [${id}] ${scenario} -> ${actual}`);
};

const citizenId = new mongoose.Types.ObjectId();
const otherCitizenId = new mongoose.Types.ObjectId();
const officialId = new mongoose.Types.ObjectId();
const complaintObjectId = new mongoose.Types.ObjectId();

const citizenUser = {
  _id: citizenId,
  name: 'Citizen A',
  email: 'citizena@test.local',
  role: ROLES.CITIZEN,
  isActive: true,
};
const otherCitizenUser = {
  _id: otherCitizenId,
  name: 'Citizen B',
  email: 'citizenb@test.local',
  role: ROLES.CITIZEN,
  isActive: true,
};
const officialUser = {
  _id: officialId,
  name: 'Official A',
  email: 'officiala@test.local',
  role: ROLES.OFFICIAL,
  isActive: true,
};

const usersById = new Map([
  [citizenId.toString(), citizenUser],
  [otherCitizenId.toString(), otherCitizenUser],
  [officialId.toString(), officialUser],
]);

let complaintDoc = {
  _id: complaintObjectId,
  complaintId: 'SCMS-2026-777777',
  userId: citizenId,
  title: 'Collapsed streetlight pole near school',
  description: 'Exposed live wire hazard near primary school entrance.',
  category: 'Electricity Issues',
  priority: 'Medium',
  status: 'Closed',
  location: { address: 'School Road', latitude: 28.614, longitude: 77.209 },
  save: async function save() {
    return this;
  },
};

let feedbackDoc = null;
const notificationsLog = [];

User.findById = (id) => ({
  select: async () => usersById.get(id.toString()) || null,
});
User.find = () => ({
  select: async () => [officialUser],
});
Complaint.findById = async (id) =>
  id.toString() === complaintObjectId.toString() ? complaintDoc : null;
Complaint.find = () => ({
  select: () => ({
    lean: async () => [complaintDoc],
  }),
});
Feedback.findOne = async () => feedbackDoc;
Feedback.create = async (payload) => {
  feedbackDoc = { _id: new mongoose.Types.ObjectId(), ...payload };
  return feedbackDoc;
};
StatusHistory.create = async (payload) => payload;
Notification.create = async (payload) => {
  notificationsLog.push(payload);
  return payload;
};

const sign = (u) => jwt.sign({ id: u._id.toString(), role: u.role }, process.env.JWT_SECRET);
const citizenToken = sign(citizenUser);
const otherCitizenToken = sign(otherCitizenUser);
const officialToken = sign(officialUser);

const runAllTests = async () => {
  // --- UNIT TESTS ---
  const pEmergency = calculateSuggestedPriority({
    category: 'Electricity Issues',
    title: 'Live wire spark near school',
    description: 'Exposed live wire sparking on pavement near school gate',
    reportedSeverity: 'High',
    nearbySimilarCount: 3,
  });
  assert.strictEqual(pEmergency.suggestedPriority, 'Emergency');
  assert.ok(pEmergency.score >= 70);
  record('UT-01', 'Smart priority engine scores emergency hazard', `Priority=${pEmergency.suggestedPriority}, Score=${pEmergency.score}`);

  const pLow = calculateSuggestedPriority({
    category: 'Other',
    title: 'Minor bench paint fade',
    description: 'Park bench paint is slightly faded.',
    reportedSeverity: 'Low',
    nearbySimilarCount: 0,
  });
  assert.strictEqual(pLow.suggestedPriority, 'Low');
  record('UT-02', 'Smart priority engine scores low-severity issue', `Priority=${pLow.suggestedPriority}, Score=${pLow.score}`);

  const dist = haversineMeters(28.6139, 77.209, 28.6145, 77.2095);
  assert.ok(dist < 150, `Expected <150m, got ${dist}`);
  const sim = computeTextSimilarity(
    'Live wire spark near school gate',
    'Exposed live wire sparking near primary school'
  );
  assert.ok(sim > 0.2);
  record('UT-03', 'Duplicate detector Haversine & text similarity', `Distance=${dist}m, Similarity=${sim}`);

  const pastDeadline = new Date(Date.now() - 5 * 3600000);
  const slaOverdue = computeSlaStatus(pastDeadline, 'In Progress');
  assert.strictEqual(slaOverdue.isOverdue, true);
  assert.strictEqual(slaOverdue.state, 'Overdue');
  record('UT-04', 'SLA monitor detects overdue assignment', `State=${slaOverdue.state}, OverdueHours=${slaOverdue.overdueHours}`);

  // --- INTEGRATION, SYSTEM & SECURITY TESTS ---
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}/api`;

  try {
    // Check duplicates endpoint
    const dupRes = await fetch(`${baseUrl}/complaints/check-duplicates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category: 'Electricity Issues',
        title: 'Collapsed streetlight pole near school',
        description: 'Exposed live wire hazard near school',
        latitude: 28.6141,
        longitude: 77.2091,
      }),
    });
    const dupJson = await dupRes.json();
    assert.strictEqual(dupRes.status, 200);
    assert.ok(dupJson.duplicates.length >= 1);
    record('IT-01', 'Duplicate check API flags nearby similar complaint', `Matches=${dupJson.duplicates.length}`);

    // Security: Non-owner citizen cannot submit feedback
    const secFbRes = await fetch(`${baseUrl}/complaints/${complaintObjectId}/feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${otherCitizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating: 5, comment: 'Hijack attempt' }),
    });
    assert.strictEqual(secFbRes.status, 403);
    record('ST-01', 'Non-owner citizen blocked from submitting feedback', `HTTP ${secFbRes.status}`);

    // Citizen submits feedback on closed complaint
    const fbRes = await fetch(`${baseUrl}/complaints/${complaintObjectId}/feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating: 5, comment: 'Quickly repaired!' }),
    });
    assert.strictEqual(fbRes.status, 201);
    record('IT-02', 'Citizen submits 1-5 rating & feedback on closed complaint', `HTTP ${fbRes.status}`);

    // Duplicate feedback prevented
    const fbDupRes = await fetch(`${baseUrl}/complaints/${complaintObjectId}/feedback`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating: 4, comment: 'Second attempt' }),
    });
    assert.strictEqual(fbDupRes.status, 409);
    record('IT-03', 'Duplicate feedback submission prevented', `HTTP ${fbDupRes.status}`);

    // Citizen reopens closed complaint
    const reopenRes = await fetch(`${baseUrl}/complaints/${complaintObjectId}/reopen`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${citizenToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'Streetlight flickered off again last night.' }),
    });
    assert.strictEqual(reopenRes.status, 200);
    assert.strictEqual(complaintDoc.status, 'Reopened');
    record('SY-01', 'Citizen reopens closed complaint and notifies officials', `Status=${complaintDoc.status}`);

    // Official escalates complaint
    const escRes = await fetch(`${baseUrl}/admin/complaints/${complaintObjectId}/escalate`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${officialToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ remarks: 'Immediate safety hazard near school.' }),
    });
    assert.strictEqual(escRes.status, 200);
    assert.strictEqual(complaintDoc.isEscalated, true);
    assert.strictEqual(complaintDoc.priority, 'Emergency');
    record('SY-02', 'Official escalates reopened complaint to Emergency', `Priority=${complaintDoc.priority}, Escalated=${complaintDoc.isEscalated}`);

    // --- PERFORMANCE TEST ---
    const syntheticComplaints = Array.from({ length: 500 }, (_, i) => ({
      _id: `id-${i}`,
      complaintId: `SCMS-2026-${100000 + i}`,
      title: `Pothole on street ${i}`,
      description: 'Large road pothole causing traffic delay.',
      category: 'Road Damage',
      status: 'Submitted',
      location: { address: `Street ${i}`, latitude: 28.61 + i * 0.0001, longitude: 77.21 },
    }));
    const t0 = performance.now();
    findPotentialDuplicates(
      {
        title: 'Large pothole on street 10',
        description: 'Road pothole causing delay',
        category: 'Road Damage',
        latitude: 28.611,
        longitude: 77.21,
      },
      syntheticComplaints
    );
    const elapsedMs = Number((performance.now() - t0).toFixed(2));
    assert.ok(elapsedMs < 200, `Expected <200ms, got ${elapsedMs}ms`);
    record('PT-01', 'Duplicate scan across 500 complaints', `Completed in ${elapsedMs}ms`);

    console.log('\nALL_PHASE_3_TESTS_PASSED');
  } finally {
    server.close();
  }
};

runAllTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
