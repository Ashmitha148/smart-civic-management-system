# Smart Civic Management System (SCMS) — Phase 1 & Phase 2

A full-stack MERN civic engagement and municipal operations platform featuring:
- **Phase 1 (Citizen Portal):** Registration/login, dashboard, Leaflet/OpenStreetMap complaint reporting with multi-image uploads, complaint tracking, and status timeline.
- **Phase 2 (Government Official & Municipal Worker Management):**
  - **Admin / Official Portal (`/admin`):** 8-metric live dashboard, category & priority distributions, complaint verification/rejection, priority setting (`Low`, `Medium`, `High`, `Emergency`), municipal worker registration & management, deadline-based worker assignment, and before-and-after completion photo verification.
  - **Municipal Worker Portal (`/worker`):** Task dashboard (total, pending, ongoing, completed, overdue), task acceptance, progress updates, and completion photo submission for official verification (workers cannot close complaints directly).
  - **Real-Time Notifications:** Socket.IO + MongoDB notifications for citizens, workers, and officials.

## Setup & Commands

### 1. Environment Variables
- Backend: copy `server/.env.example` to `server/.env` and configure `MONGO_URI`, `JWT_SECRET`, and Cloudinary credentials.
- Frontend: copy `client/.env.example` to `client/.env`.

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

### 4. Run Servers
```bash
# Terminal 1 (Backend + Socket.IO)
cd server && npm run dev

# Terminal 2 (Frontend Vite)
cd client && npm run dev
```

### 5. Run Phase 2 Workflow Tests
```bash
cd server
node src/tests/phase2.test.js
```
