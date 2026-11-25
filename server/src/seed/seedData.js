import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Worker from '../models/Worker.js';
import Assignment from '../models/Assignment.js';
import Complaint from '../models/Complaint.js';
import StatusHistory from '../models/StatusHistory.js';
import Notification from '../models/Notification.js';
import { ROLES } from '../constants/roles.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Worker.deleteMany({}),
      Assignment.deleteMany({}),
      Complaint.deleteMany({}),
      StatusHistory.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    const citizen = await User.create({
      name: 'Aarav Sharma',
      email: 'citizen@scms.local',
      password: 'Password@123',
      phone: '+1-555-0101',
      address: '104 Maple Street, Ward 3',
      role: ROLES.CITIZEN,
    });

    const official = await User.create({
      name: 'Elena Vance (Municipal Officer)',
      email: 'official@scms.local',
      password: 'Password@123',
      phone: '+1-555-0102',
      address: 'City Hall Civic Center',
      role: ROLES.OFFICIAL,
      department: 'Public Works Administration',
      employeeId: 'GOV-OFF-101',
    });

    const workerUser = await User.create({
      name: 'Marcus Reid',
      email: 'worker@scms.local',
      password: 'Password@123',
      phone: '+1-555-0103',
      address: 'Ward 3 & Central Zone',
      role: ROLES.WORKER,
      department: 'Road Maintenance',
      employeeId: 'MUN-WRK-204',
    });

    const workerProfile = await Worker.create({
      userId: workerUser._id,
      name: workerUser.name,
      email: workerUser.email,
      phone: workerUser.phone,
      employeeId: 'MUN-WRK-204',
      department: 'Road Maintenance',
      assignedArea: 'Ward 3 & Central Zone',
      availability: 'Available',
      isActive: true,
    });

    const deadlineDate = new Date();
    deadlineDate.setDate(deadlineDate.getDate() + 3);

    const complaints = await Complaint.insertMany([
      {
        complaintId: 'SCMS-2026-100001',
        userId: citizen._id,
        title: 'Deep pothole near Central Market crossing',
        description:
          'A large pothole has formed at the main intersection causing traffic slowdowns and posing a hazard for two-wheelers.',
        category: 'Road Damage',
        location: {
          address: '12 Central Market Road, Ward 3',
          landmark: 'Near Metro Gate 2',
          latitude: 28.6145,
          longitude: 77.2095,
        },
        priority: 'High',
        status: 'In Progress',
        assignedWorkerId: workerUser._id,
        assignedByOfficialId: official._id,
        assignedDepartment: 'Road Maintenance',
        deadline: deadlineDate,
        verifiedBy: official._id,
        verifiedAt: new Date(),
        officialRemarks: 'Field crew dispatched with asphalt patching unit.',
      },
      {
        complaintId: 'SCMS-2026-100002',
        userId: citizen._id,
        title: 'Streetlight non-functional on Elm Avenue',
        description:
          'Three consecutive LED streetlight poles have been out for the past 4 nights, leaving the pedestrian walkway dark.',
        category: 'Streetlight Issues',
        location: {
          address: '88 Elm Avenue, Ward 3',
          landmark: 'Opposite Community Park',
          latitude: 28.618,
          longitude: 77.212,
        },
        priority: 'Medium',
        status: 'Submitted',
      },
      {
        complaintId: 'SCMS-2026-100003',
        userId: citizen._id,
        title: 'Main water supply pipe leakage',
        description:
          'Clean drinking water is leaking continuously from an underground valve junction near the corner.',
        category: 'Water Leakage',
        location: {
          address: '215 Oakwood Lane, Ward 3',
          landmark: 'Beside Municipal Primary School',
          latitude: 28.611,
          longitude: 77.205,
        },
        priority: 'Emergency',
        status: 'Closed',
        assignedWorkerId: workerUser._id,
        assignedByOfficialId: official._id,
        assignedDepartment: 'Water Supply',
        verifiedBy: official._id,
        verifiedAt: new Date(),
        officialRemarks: 'Valve gasket replaced and pressure tested.',
        resolutionNotes: 'Leakage sealed and road surface restored.',
        resolvedAt: new Date(),
      },
    ]);

    const assignment = await Assignment.create({
      complaintId: complaints[0]._id,
      workerId: workerUser._id,
      workerProfileId: workerProfile._id,
      assignedBy: official._id,
      deadline: deadlineDate,
      instructions: 'Set up safety cones and patch pothole with hot-mix asphalt.',
      status: 'In Progress',
      acceptedAt: new Date(),
      startedAt: new Date(),
    });

    await Complaint.findByIdAndUpdate(complaints[0]._id, {
      currentAssignmentId: assignment._id,
    });

    await StatusHistory.insertMany([
      {
        complaintId: complaints[0]._id,
        previousStatus: null,
        status: 'Submitted',
        remarks: 'Complaint submitted by citizen.',
        updatedBy: citizen._id,
        updatedByRole: ROLES.CITIZEN,
      },
      {
        complaintId: complaints[0]._id,
        previousStatus: 'Submitted',
        status: 'Verified',
        remarks: 'Verified by municipal officer.',
        updatedBy: official._id,
        updatedByRole: ROLES.OFFICIAL,
      },
      {
        complaintId: complaints[0]._id,
        previousStatus: 'Verified',
        status: 'Assigned',
        remarks: 'Assigned to Road Maintenance field engineer.',
        updatedBy: official._id,
        updatedByRole: ROLES.OFFICIAL,
      },
      {
        complaintId: complaints[0]._id,
        previousStatus: 'Assigned',
        status: 'In Progress',
        remarks: 'Crew on site inspecting pavement damage.',
        updatedBy: workerUser._id,
        updatedByRole: ROLES.WORKER,
      },
      {
        complaintId: complaints[1]._id,
        previousStatus: null,
        status: 'Submitted',
        remarks: 'Complaint submitted by citizen.',
        updatedBy: citizen._id,
        updatedByRole: ROLES.CITIZEN,
      },
      {
        complaintId: complaints[2]._id,
        previousStatus: null,
        status: 'Submitted',
        remarks: 'Complaint submitted by citizen.',
        updatedBy: citizen._id,
        updatedByRole: ROLES.CITIZEN,
      },
      {
        complaintId: complaints[2]._id,
        previousStatus: 'Resolved - Pending Verification',
        status: 'Closed',
        remarks: 'Verified resolved by municipal administration.',
        updatedBy: official._id,
        updatedByRole: ROLES.OFFICIAL,
      },
    ]);

    await Notification.insertMany([
      {
        userId: citizen._id,
        complaintId: complaints[0]._id,
        complaintCode: complaints[0].complaintId,
        title: 'Work In Progress',
        message: 'Field Engineer Marcus Reid has started work on SCMS-2026-100001.',
        type: 'STATUS_UPDATED',
        isRead: false,
      },
      {
        userId: workerUser._id,
        complaintId: complaints[0]._id,
        complaintCode: complaints[0].complaintId,
        title: 'New Task Assigned',
        message: 'You have been assigned SCMS-2026-100001 (Central Market crossing).',
        type: 'TASK_ASSIGNED',
        isRead: false,
      },
    ]);

    console.log('Seed data inserted successfully.');
    console.log('Citizen:  citizen@scms.local / Password@123');
    console.log('Official: official@scms.local / Password@123');
    console.log('Worker:   worker@scms.local / Password@123');
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedDatabase();
