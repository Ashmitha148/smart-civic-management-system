<div align="center">
  <img src="./docs/assets/scms-logo.svg" alt="SCMS Logo" width="72" height="72" />
  <h1>Smart Civic Management System (SCMS)</h1>
  <p>
    <strong>Building Better Cities Together</strong> — A full-stack MERN civic engagement, municipal workforce dispatch, and geospatial analytics platform.
  </p>
  <p>
    <a href="https://smart-civic-management-system-clien-ashy.vercel.app/">Live Frontend (Vercel)</a>
    &nbsp;&bull;&nbsp;
    <a href="https://scms-backend-zn22.onrender.com/api/health">Backend API Health (Render)</a>
    &nbsp;&bull;&nbsp;
    <a href="./docs/FINAL_PROJECT_REPORT.md">Final Project Report</a>
  </p>
</div>

---

## Screenshots

### Landing Page & Hero
![SCMS Landing Page](./docs/screenshots/landing-hero.jpg)

### Platform Features
![SCMS Platform Features](./docs/screenshots/platform-features.jpg)

---

## Key Features (Phases 1–3)

- **Citizen Portal (`/dashboard`, `/complaints`):** Registration/login, interactive Leaflet/OpenStreetMap location pinning, multi-photo uploads (Cloudinary), duplicate complaint warnings before submission, live status timeline, 1–5 star feedback, and complaint reopening.
- **Government Official / Admin Portal (`/admin`):** 8-metric live dashboard, rule-based smart priority suggestions with override, suspected duplicate flags, worker registration & management, deadline-based worker assignment, before-and-after photo verification, SLA monitoring & escalation, Leaflet.heat geographical heatmap, and Recharts analytics with CSV export.
- **Municipal Worker Portal (`/worker`):** Dedicated task queue (total, pending, ongoing, completed, overdue), task acceptance, `In Progress` updates, and completion photo uploads (workers cannot close complaints directly).
- **Security & Real-Time:** JWT + `bcrypt` authentication, strict role-based access control (`citizen`, `official`, `worker`), `helmet`, `express-rate-limit`, Multer file validation, and Socket.IO real-time notifications stored in MongoDB.

---

## Setup & Commands

### 1. Environment Variables
- Backend: copy `server/.env.example` to `server/.env` and configure `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, and Cloudinary credentials.
- Frontend: copy `client/.env.example` to `client/.env` and set `VITE_API_URL`.

### 2. Install Dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 3. Seed Sample Data (MongoDB required)
```bash
cd server
npm run seed
```
Seeded accounts:
- **Citizen:** `citizen@scms.local` / `Password@123`
- **Government Official (Admin):** `official@scms.local` / `Password@123`
- **Municipal Worker:** `worker@scms.local` / `Password@123`

### 4. Run Locally
```bash
# Terminal 1 (Backend + Socket.IO)
cd server && npm run dev

# Terminal 2 (Frontend Vite)
cd client && npm run dev
```

### 5. Run Automated Tests
```bash
cd server
node src/tests/phase2.test.js
node src/tests/phase3.test.js
```
