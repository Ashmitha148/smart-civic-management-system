# Software Requirements Specification (SRS)
## Smart Civic Management System (SCMS)

**Standard:** IEEE Std 830-1998 (with ISO/IEC/IEEE 29148 alignment)  
**Version:** 1.0  
**Project Team:** Ashmitha (LCS2025060), Akshara (LCS2025005), Amishka (LCS2025058), Sapna (LIT2025051)  
**Live Deployment:** https://smart-civic-management-system-clien-ashy.vercel.app/  
**Repository:** https://github.com/Ashmitha148/smart-civic-management-system  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the complete functional and non-functional requirements for the **Smart Civic Management System (SCMS)**. It serves as a binding specification between project stakeholders (municipal citizens and administrators) and the development and testing team, establishing a verifiable baseline for system design, implementation, and acceptance testing.

### 1.2 Scope
SCMS is a full-stack web platform designed to digitize municipal issue reporting, verification, workforce dispatch, and resolution tracking.
- **Included in Scope:**
  - Citizen registration, authentication, geo-tagged complaint submission with multi-image uploads, duplicate warning checks, status timeline tracking, 1–5 star feedback, and complaint reopening.
  - Government Official (Admin) dashboard, complaint verification/rejection, rule-based smart priority review/override, municipal worker registration and management, deadline-based task assignment, before-and-after completion photo verification, SLA escalation, geographical complaint heatmaps, and Recharts analytics with CSV export.
  - Municipal Worker dashboard, task acceptance, progress updates, and completion photo submission.
  - Real-time notifications via Socket.IO persisted in MongoDB.
- **Excluded from Scope:**
  - Native iOS/Android mobile applications, automated payment/fine processing, and third-party SMS gateway billing.

### 1.3 Definitions, Acronyms, and Abbreviations
| Term / Acronym | Definition |
|---|---|
| **SCMS** | Smart Civic Management System |
| **SRS** | Software Requirements Specification |
| **RBAC** | Role-Based Access Control |
| **SLA** | Service Level Agreement (resolution deadline window) |
| **JWT** | JSON Web Token used for stateless API authentication |
| **FR / NFR** | Functional Requirement / Non-Functional Requirement |
| **Citizen** | Public user who submits and tracks civic complaints |
| **Official (Admin)** | Municipal authority who verifies, assigns, and closes complaints |
| **Worker** | Municipal field staff assigned to resolve verified complaints |

### 1.4 References
1. IEEE Std 830-1998, *IEEE Recommended Practice for Software Requirements Specifications*.
2. ISO/IEC/IEEE 29148:2018, *Systems and Software Engineering — Life Cycle Processes — Requirements Engineering*.
3. SCMS Architecture & API Documentation: `docs/ARCHITECTURE.md`, `docs/API.md`.

### 1.5 Overview
Section 2 describes the product perspective, user characteristics, constraints, and assumptions. Section 3 details external interfaces, numbered functional requirements (`FR-01`–`FR-20`), performance targets, design constraints, and measurable quality attributes (`NFR-01`–`NFR-10`). Section 4 provides the Verification & Traceability Matrix.

---

## 2. Overall Description

### 2.1 Product Perspective
SCMS is a standalone, cloud-deployed three-tier web application:
1. **Presentation Layer:** React.js + Vite SPA hosted on Vercel.
2. **Application Layer:** Node.js + Express.js REST API and Socket.IO server hosted on Render.
3. **Data & Media Layer:** MongoDB Atlas (structured documents) and Cloudinary (uploaded evidence images).

### 2.2 Product Functions
- **Identity & Access Management:** Secure registration, login, `bcrypt` password hashing, JWT authentication, and 3-role RBAC.
- **Civic Issue Reporting:** Interactive OpenStreetMap/Leaflet coordinate selection, manual address entry, multi-photo upload, and pre-submission duplicate detection.
- **Administrative Triage & Dispatch:** Rule-based smart priority suggestions, verification/rejection, worker directory management, and deadline-bound assignments.
- **Field Resolution & Auditing:** Worker task execution, before-and-after image comparison, and official-only closure.
- **Monitoring & Analytics:** SLA overdue detection, escalation, real-time notifications, Leaflet.heat hotspots, and Recharts dashboards.

### 2.3 User Characteristics
| User Class | Technical Expertise | Primary Needs |
|---|---|---|
| **Citizen** | General public; basic web/mobile literacy | Simple, zero-training interface to report issues, attach photos, pin locations, and track progress |
| **Government Official** | Administrative staff; familiar with web dashboards | Rapid triage, duplicate/priority insights, worker dispatch, SLA alerts, and analytical reports |
| **Municipal Worker** | Field technicians; mobile-browser usage | Clear task list, exact map location, deadline visibility, and quick photo upload |

### 2.4 Constraints
- **C-01:** Public registration shall only create `Citizen` accounts; `Official` and `Worker` accounts shall be provisioned internally.
- **C-02:** Uploaded images shall be restricted to JPEG, PNG, and WEBP formats with a maximum size of 5 MB per file and 5 files per upload.
- **C-03:** Municipal workers shall not be permitted to transition a complaint directly to `Closed`.

### 2.5 Assumptions and Dependencies
- Users have modern web browsers (Chrome, Edge, Firefox, Safari) with JavaScript enabled.
- OpenStreetMap tile servers, MongoDB Atlas, and Cloudinary services are reachable over HTTPS.

---

## 3. Specific Requirements

### 3.1 External Interface Requirements
- **User Interfaces:** Responsive web UI built with Tailwind CSS supporting desktop (`>= 1024px`) and mobile (`>= 360px`) viewports.
- **Software Interfaces:**
  - RESTful JSON/Multipart API (`/api/*`) over HTTPS.
  - WebSocket event stream (`notification:new`) via Socket.IO.
  - OpenStreetMap tile API via Leaflet and Cloudinary Upload API.
- **Communications Interfaces:** HTTPS (TLS 1.2+) for all client-server traffic; JWT Bearer tokens in `Authorization` headers.

### 3.2 Functional Requirements

#### Authentication & Authorization
- **FR-01 [Priority: High]:** The system shall allow citizens to register using a full name, unique email address, and password of at least 8 characters, and shall assign the `citizen` role exclusively.
- **FR-02 [Priority: High]:** The system shall reject any public registration request that attempts to specify a non-citizen role (`official` or `worker`) with HTTP `403`.
- **FR-03 [Priority: High]:** The system shall authenticate registered users via email and password and issue a signed JWT token.

#### Citizen Complaint Submission & Tracking
- **FR-04 [Priority: High]:** The system shall allow authenticated citizens to submit a complaint with title, detailed description, category (8 predefined categories), manual address, optional landmark, interactive Leaflet map coordinates, and up to 5 images.
- **FR-05 [Priority: Medium]:** The system shall check incoming complaint details against recent complaints in the same category using Haversine distance ($\le 300\text{ m}$) and Jaccard text similarity, and shall display a non-blocking duplicate warning to the citizen before submission.
- **FR-06 [Priority: High]:** The system shall generate a unique tracking identifier (`SCMS-YYYY-XXXXXX`), set the initial status to `Submitted`, and record an initial `StatusHistory` entry.
- **FR-07 [Priority: High]:** The system shall restrict citizens to viewing only complaints they submitted (`403` on unauthorized access).
- **FR-08 [Priority: Medium]:** The system shall allow citizens to submit a 1–5 star rating and written feedback once for a `Closed` complaint, and shall reject duplicate feedback submissions with HTTP `409`.
- **FR-09 [Priority: Medium]:** The system shall allow citizens to reopen a `Closed` complaint by providing a mandatory reason of at least 5 characters, transitioning status to `Reopened` and notifying officials.

#### Government Official (Admin) Operations
- **FR-10 [Priority: High]:** The system shall deny citizens and workers access to all `/api/admin/*` endpoints with HTTP `403`.
- **FR-11 [Priority: Medium]:** The system shall compute a transparent rule-based priority score (`0–100`) and display a suggested priority (`Low`, `Medium`, `High`, or `Emergency`) to officials, who shall be able to override it.
- **FR-12 [Priority: High]:** The system shall allow officials to verify (`Verified`) or reject (`Rejected` with mandatory remarks) complaints and record every transition in `StatusHistory`.
- **FR-13 [Priority: High]:** The system shall allow officials to register, edit, and filter municipal workers by department, assigned area, availability, and active status.
- **FR-14 [Priority: High]:** The system shall allow officials to assign a `Verified` or `Reopened` complaint to an `Available` and active worker with a mandatory deadline and instructions, updating status to `Assigned`.
- **FR-15 [Priority: High]:** The system shall display citizen "before" images and worker "after" completion images side-by-side to officials for audit, allowing approval (`Closed`) or rejection (`Reopened` with mandatory remarks).
- **FR-16 [Priority: Medium]:** The system shall identify overdue complaints in UTC, dispatch deadline alerts, and allow officials to escalate active complaints to `Emergency` priority.
- **FR-17 [Priority: Medium]:** The system shall provide officials with a geographical complaint heatmap filterable by category, priority, and date range, and an analytics dashboard with CSV export.

#### Municipal Worker Operations & Notifications
- **FR-18 [Priority: High]:** The system shall restrict municipal workers to viewing and updating only complaints assigned to them (`403` otherwise).
- **FR-19 [Priority: High]:** The system shall allow assigned workers to accept tasks, update status to `In Progress`, and upload completion photographs to transition status to `Resolved - Pending Verification`, while blocking direct `Closed` transitions with HTTP `403`.
- **FR-20 [Priority: Medium]:** The system shall persist notifications in MongoDB, deliver real-time updates via Socket.IO, and allow users to mark individual or all notifications as read.

### 3.3 Performance Requirements
- **PR-01:** Standard REST API endpoints (`/api/complaints/my`, `/api/dashboard/citizen`, `/api/admin/dashboard`) shall respond within 500 ms under normal load.
- **PR-02:** Duplicate detection across 500 recent complaints shall complete in under 200 ms.
- **PR-03:** Frontend initial production bundle shall render interactive pages within 2 seconds on standard broadband connections.

### 3.4 Design Constraints
- **DC-01:** Backend persistence shall use MongoDB with Mongoose schemas and indexed query fields (`complaintId`, `userId`, `assignedWorkerId`, `status`).
- **DC-02:** Mapping shall use Leaflet and OpenStreetMap without proprietary map API keys.

### 3.5 Quality Attributes (Non-Functional Requirements)
- **NFR-01 (Security - Hashing):** All user passwords shall be hashed using `bcrypt` with 12 salt rounds and shall never be serialized in API JSON responses.
- **NFR-02 (Security - Rate Limiting):** Authentication endpoints (`/api/auth/login`, `/api/auth/register`) shall enforce rate limiting of 50 requests per 15-minute window; general `/api` routes shall enforce 300 requests per 15-minute window.
- **NFR-03 (Security - Headers & CORS):** The backend shall apply `helmet` HTTP security headers and restrict CORS origins to the configured `CLIENT_URL`.
- **NFR-04 (Usability):** Citizens shall be able to locate and submit a new complaint in 3 clicks or fewer from the dashboard or landing page.
- **NFR-05 (Reliability):** Every complaint status change shall atomically record `previousStatus`, `status`, `updatedBy`, `updatedByRole`, and timestamp in `StatusHistory`.
- **NFR-06 (Maintainability):** Backend business logic shall be modularized into `models/`, `controllers/`, `routes/`, `middleware/`, and `utils/` to support future extensions.
- **NFR-07 (Portability):** Environment-specific secrets and URLs shall be externalized via `.env` variables, enabling deployment across local, Render, and Vercel environments without code edits.

---

## 4. Verification & Requirements Traceability Matrix (RTM)

| Requirement ID | Implementing Module / Endpoint | Verified By Test Case | Status |
|---|---|---|---|
| **FR-01, FR-02** | `authController.register` (`POST /api/auth/register`) | Phase 1 RBAC Check (`403` on `official` role) | **Verified** |
| **FR-05, PR-02** | `duplicateDetector.js` (`POST /api/complaints/check-duplicates`) | `UT-03`, `IT-01`, `PT-01` (`2.31 ms` for 500 records) | **Verified** |
| **FR-08, FR-09** | `complaintController.js` (`/:id/feedback`, `/:id/reopen`) | `IT-02`, `IT-03`, `ST-01`, `SY-01` | **Verified** |
| **FR-10, FR-12** | `adminController.js` (`/api/admin/*`) | Phase 2 Test #1 (`403`), #2 (`Verified`) | **Verified** |
| **FR-11** | `priorityEngine.js` | `UT-01` (`Emergency`, 100), `UT-02` (`Low`, 10) | **Verified** |
| **FR-14, FR-15** | `adminController.assignWorker`, `approveCompletion` | Phase 2 Test #3 (`Assigned`), #7 (`Closed`) | **Verified** |
| **FR-16** | `slaMonitor.js`, `analyticsController.escalateComplaint` | `UT-04` (`Overdue`), `SY-02` (`Emergency`) | **Verified** |
| **FR-18, FR-19** | `workerController.js` (`/api/worker/tasks/*`) | Phase 2 Test #4 (`403`), #5 (`In Progress`), #6 (`403` close block) | **Verified** |
| **FR-20** | `notify.js`, `socket.js`, `notificationController.js` | Phase 2 Test #8 (`4` notifications recorded) | **Verified** |
