# Smart Civic Management System (SCMS) — Architecture

## Phase 1 Scope & Modularity
Phase 1 implements the complete Citizen-facing experience and establishes the shared authentication, RBAC, and database foundations required for Phase 2 (Government Official & Municipal Worker modules).

### Backend (`server/src/`)
- `constants/roles.js`: Centralizes `ROLES` (`citizen`, `official`, `worker`), `COMPLAINT_CATEGORIES`, `COMPLAINT_STATUSES`, and `COMPLAINT_PRIORITIES`.
- `models/`:
  - `User`: Supports `citizen`, `official`, and `worker` roles, plus Phase 2 `department` and `employeeId` fields.
  - `Complaint`: Includes `assignedWorkerId`, `assignedByOfficialId`, `assignedDepartment`, `officialRemarks`, `resolutionNotes`, and `resolvedAt` so Phase 2 requires zero breaking schema migrations.
  - `StatusHistory`: Tracks every status transition with `updatedBy` and `updatedByRole`.
  - `Notification`: Stores citizen-facing alerts linked to complaints.
- `middleware/authMiddleware.js`: Exports `protect` (JWT verification) and `authorizeRoles(...roles)` for route-level RBAC.

### Frontend (`client/src/`)
- `context/AuthContext.jsx`: Manages JWT session and user profile.
- `components/common/ProtectedRoute.jsx`: Enforces authentication and role checks (`allowedRoles`).
- `pages/`: Modular pages for Landing, Login, Register, Citizen Dashboard, Submit Complaint, My Complaints, and Complaint Details.

## Phase 2 Extension Path
1. Add `officialRoutes.js` & `workerRoutes.js` protected by `authorizeRoles(ROLES.OFFICIAL)` and `authorizeRoles(ROLES.WORKER)`.
2. Mount `/api/dashboard/official` and `/api/dashboard/worker` in `dashboardRoutes.js`.
3. Add Official & Worker dashboard routes inside `client/src/App.jsx` using `ProtectedRoute`.
