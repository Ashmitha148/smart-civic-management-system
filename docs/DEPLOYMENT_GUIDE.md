# SCMS Production Deployment Guide

## 1. MongoDB Atlas (Database)
1. Create a free M0 cluster on MongoDB Atlas.
2. Create a database user and allow network access (`0.0.0.0/0` or Render outbound IPs).
3. Copy the connection string (`mongodb+srv://<user>:<password>@cluster.mongodb.net/smart_civic_db`).

## 2. Cloudinary (Image Storage)
1. Sign in to Cloudinary and note your `Cloud Name`, `API Key`, and `API Secret`.
2. Uploaded citizen & worker images are stored in folder `scms/complaints`.

## 3. Render (Backend + Socket.IO)
1. Push the repository to GitHub.
2. Create a new **Web Service** on Render (or use `render.yaml` Blueprint) pointing to `server/`.
3. Set environment variables:
   - `NODE_ENV=production`
   - `MONGO_URI=<your_atlas_uri>`
   - `JWT_SECRET=<strong_random_secret>`
   - `CLIENT_URL=https://<your-vercel-domain>.vercel.app`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. Verify `/api/health` returns `200 OK`.

## 4. Vercel (Frontend)
1. Import the GitHub repository in Vercel and set Root Directory to `client`.
2. `client/vercel.json` handles React Router SPA rewrites automatically.
3. Set Environment Variable:
   - `VITE_API_URL=https://<your-render-service>.onrender.com/api`
4. Deploy and test Citizen, Official, and Worker logins.
