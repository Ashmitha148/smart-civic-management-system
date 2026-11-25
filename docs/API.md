# SCMS REST API Reference (Phase 1 & Phase 2)

Base URL: `http://localhost:5000/api`

## Public
- `GET /health` — API health check.
- `GET /public/stats` — Aggregate civic metrics for the landing page.

## Authentication (`/api/auth`)
- `POST /auth/register` — Register a new **Citizen** account (rejects non-citizen roles).
- `POST /auth/login` — Authenticate and receive JWT + user profile.
- `GET /auth/me` — Get current authenticated user.
- `PATCH /auth/me` — Update current user's name, phone, or address.

## Citizen Complaints & Dashboard
- `POST /complaints` — Create a complaint (`multipart/form-data`, up to 5 images). Citizen only.
- `GET /complaints/my` — List logged-in citizen's complaints. Citizen only.
- `GET /complaints/:id` — Get complaint details + `statusHistory`.
- `GET /dashboard/citizen` — Citizen dashboard stats, recent complaints, notifications.

## Notifications (`/api/notifications`)
- `GET /notifications` — List notifications for the logged-in user.
- `PATCH /notifications/:id/read` — Mark a notification as read.
- `PATCH /notifications/read-all` — Mark all notifications as read.

## Admin / Government Official (`/api/admin`) — Official Role Only
- `GET /admin/dashboard` — Full admin stats (total, submitted, awaitingVerification, assigned, ongoing, resolved, rejected, overdue), category/priority breakdown, recent activity, notifications.
- `GET /admin/complaints` — List all complaints with search, status, category, priority, and overdue filters.
- `GET /admin/complaints/:id` — Detailed complaint view with `statusHistory`, `assignments`, and `eligibleWorkers`.
- `PATCH /admin/complaints/:id/verify` — Verify a complaint (`Submitted`/`Under Review`/`Reopened` → `Verified`).
- `PATCH /admin/complaints/:id/reject` — Reject a complaint with required remarks.
- `PATCH /admin/complaints/:id/priority` — Set priority (`Low`, `Medium`, `High`, `Emergency`).
- `POST /admin/assignments` — Assign an available worker with deadline and instructions (`Verified` → `Assigned`).
- `PATCH /admin/complaints/:id/approve-completion` — Approve completion photos & close complaint (`Resolved - Pending Verification` → `Closed`).
- `PATCH /admin/complaints/:id/reject-completion` — Reject completion photos with required remarks (`Resolved - Pending Verification` → `Reopened`).
- `GET /admin/workers` — List workers with performance metrics.
- `POST /admin/workers` — Register a new municipal worker (`User` + `Worker` profile).
- `GET /admin/workers/:id` — View worker profile and assignment history.
- `PATCH /admin/workers/:id` — Edit worker profile, department, area, availability, or active status.

## Municipal Worker (`/api/worker`) — Worker Role Only
- `GET /worker/dashboard` — Worker stats (total, pending, ongoing, completed, overdue), recent tasks, notifications.
- `GET /worker/tasks` — List complaints assigned to the logged-in worker.
- `GET /worker/tasks/:id` — View assigned task details (403 if not assigned to this worker).
- `PATCH /worker/tasks/:id/accept` — Acknowledge/accept assigned task.
- `PATCH /worker/tasks/:id/status` — Update task status to `In Progress` with remarks (explicitly blocks `Closed` with 403).
- `POST /worker/tasks/:id/complete` — Upload completion photos (`multipart/form-data`) and submit for official verification (`Resolved - Pending Verification`).
