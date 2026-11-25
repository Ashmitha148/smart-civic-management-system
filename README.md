# Smart Civic Management System (SCMS)

### Report. Assign. Resolve. Improve.

## 1. Project Overview

The **Smart Civic Management System (SCMS)** is a centralized web-based platform designed to improve the efficiency, transparency, and accountability of municipal services.

The system connects citizens, government officials, and municipal workers through a digital platform where citizens can report civic issues such as potholes, overflowing garbage bins, water leakage, drainage problems, and broken streetlights.

Citizens can submit complaints along with photographs and geographical locations. Government officials can review complaints, assign appropriate municipal workers, set deadlines, and monitor progress. Workers can access assigned tasks, update their progress, and upload completion photographs for verification.

The platform aims to streamline the entire civic complaint lifecycle, from reporting an issue to its successful resolution.

## 2. Problem Statement

Traditional civic complaint management systems often suffer from inefficient complaint handling, delayed responses, lack of transparency, and inadequate coordination between citizens and municipal authorities.

Citizens may find it difficult to track their complaints, while government officials face challenges in allocating workers and monitoring resolution progress.

The proposed Smart Civic Management System addresses these challenges by providing a centralized digital platform for complaint registration, worker allocation, progress tracking, and resolution verification.

## 3. Objectives

- Digitize the traditional civic complaint management process.
- Provide citizens with an accessible platform to report public issues.
- Improve communication between citizens and municipal authorities.
- Enable efficient allocation of municipal workers.
- Ensure transparency through complaint tracking and status updates.
- Monitor worker performance and complaint resolution time.
- Improve accountability through image-based verification.
- Support data-driven municipal decision-making.

## 4. User Roles and Functionalities

### 4.1 Citizen

- Register and log in securely.
- Submit complaints with descriptions and photographs.
- Select appropriate complaint categories.
- Add geographical location and address.
- Receive a unique complaint tracking ID.
- Track complaint status and progress.
- Receive notifications about complaint updates.
- Provide feedback and ratings.
- Reopen complaints if the issue remains unresolved.

### 4.2 Government Official (Admin)

- View and manage all submitted complaints.
- Verify or reject complaints.
- Assign complaint priorities.
- Register and manage municipal workers.
- Assign workers based on department, location, and availability.
- Set deadlines for complaint resolution.
- Monitor ongoing tasks and worker progress.
- Verify completion photographs.
- Approve or reject completed tasks.
- Generate reports and view analytics.

### 4.3 Municipal Worker

- Log in to the worker dashboard.
- View assigned tasks.
- Access complaint descriptions and photographs.
- View complaint locations.
- Accept assigned tasks.
- Update task progress.
- Upload before-and-after photographs.
- Submit completed tasks for official verification.
- View task history and completed assignments.

## 5. Key Features

| Feature | Description |
|---|---|
| Complaint Registration | Citizens can submit civic complaints online. |
| Image Upload | Upload photographs as evidence of civic issues. |
| Location Tagging | Identify complaint locations using interactive maps. |
| Complaint Tracking | Monitor complaint progress through status timelines. |
| Worker Allocation | Officials assign suitable workers to complaints. |
| Priority Management | Classify complaints based on urgency. |
| Before-and-After Verification | Compare original and completed work photographs. |
| Real-Time Notifications | Notify users about complaint updates. |
| Duplicate Detection | Identify potentially similar complaints. |
| Complaint Heatmap | Visualize geographical complaint concentrations. |
| SLA Monitoring | Track deadlines and overdue complaints. |
| Performance Analytics | Monitor worker and department performance. |
| Citizen Feedback | Collect ratings and resolution feedback. |
| Complaint Escalation | Flag unresolved complaints for administrative attention. |

## 6. Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Lucide React
- Recharts

### Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcrypt
- Multer

### Database and Storage

- MongoDB Atlas
- Mongoose
- Cloudinary

### Additional Technologies

- Leaflet
- OpenStreetMap
- Socket.IO
- Postman
- Git and GitHub

### Deployment

- Vercel – Frontend
- Render – Backend
- MongoDB Atlas – Database
- Cloudinary – Image Storage

## 7. System Architecture

The application follows a three-tier architecture.

1. **Presentation Layer:** React-based interfaces for citizens, government officials, and municipal workers.
2. **Application Layer:** Node.js and Express.js handle authentication, business logic, complaint processing, and worker allocation.
3. **Data Layer:** MongoDB stores users, complaints, assignments, notifications, and feedback.

External services such as Cloudinary, OpenStreetMap, and Socket.IO support image storage, geographical mapping, and real-time communication.

## 8. Complaint Resolution Workflow

The system follows a structured complaint lifecycle:

1. Citizen submits a complaint with images and location.
2. Government official reviews the complaint.
3. Official verifies the complaint and assigns priority.
4. Official appoints an appropriate municipal worker.
5. Worker receives and acknowledges the assignment.
6. Worker updates the status to In Progress.
7. Worker completes the task and uploads completion photographs.
8. Official verifies the submitted work.
9. Official approves the resolution and closes the complaint.
10. Citizen receives a notification and provides feedback.

### Complaint Statuses

- Submitted
- Under Review
- Verified
- Assigned
- In Progress
- Resolved – Pending Verification
- Closed
- Rejected
- Reopened

## 9. Development Methodology – Agile Model

The project follows the Agile Software Development Model, where development is divided into three incremental phases.

Each phase involves planning, design, implementation, testing, and evaluation.

### Phase 1 – Foundation and Citizen Portal

- Project setup and configuration.
- Database integration.
- User registration and authentication.
- Role-based access control.
- Citizen dashboard.
- Complaint submission.
- Image upload using Cloudinary.
- Location selection using Leaflet.
- Unique complaint ID generation.
- Complaint tracking.

**Deliverable:** Functional citizen complaint registration portal.

### Phase 2 – Government Administration and Worker Management

- Government official dashboard.
- Complaint verification and rejection.
- Complaint priority management.
- Municipal worker registration.
- Worker allocation.
- Deadline management.
- Worker dashboard.
- Task progress updates.
- Before-and-after image uploads.
- Official completion verification.
- Notification integration.

**Deliverable:** Complete complaint assignment and resolution workflow.

### Phase 3 – Smart Features, Testing and Deployment

- Automatic priority suggestions.
- Duplicate complaint detection.
- Geographical complaint heatmap.
- SLA monitoring.
- Worker performance analytics.
- Citizen feedback and complaint reopening.
- Advanced admin analytics.
- Real-time notification improvements.
- Security and performance testing.
- Application deployment.
- Final project documentation.

**Deliverable:** Complete Smart Civic Management System.

## 10. Project Structure

```text
smart-civic-management-system/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── citizen/
│   │   │   ├── admin/
│   │   │   └── worker/
│   │   ├── layouts/
│   │   ├── context/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── seed/
│   ├── server.js
│   └── package.json
│
├── docs/
│   ├── SRS.md
│   ├── SDD.md
│   ├── UML/
│   ├── test-cases.md
│   └── feasibility-study.md
│
├── README.md
└── .gitignore
```

## 11. Installation and Setup

### Prerequisites

Ensure that the following are installed:

- Node.js (LTS version)
- npm
- Git
- MongoDB Atlas account
- Cloudinary account

### Step 1: Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd smart-civic-management-system
```

### Step 2: Install Frontend Dependencies

```bash
cd client
npm install
```

### Step 3: Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
```

Create a `.env` file inside the `client` directory if your frontend uses an API base URL.

```env
VITE_API_URL=http://localhost:5000/api
```

Never commit actual credentials or secret keys to GitHub.

### Step 5: Run the Application

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Open the local development URL provided by Vite, usually:

```text
http://localhost:5173
```

## 12. Testing

The application should undergo the following testing procedures:

- Unit Testing
- Integration Testing
- Functional Testing
- System Testing
- Security Testing
- Performance Testing
- User Acceptance Testing

### Important Test Scenarios

1. Citizen successfully registers and logs in.
2. Citizen submits a complaint with photographs.
3. Complaint is correctly stored in MongoDB.
4. Official verifies and assigns a complaint.
5. Worker receives and updates the assigned task.
6. Worker uploads completion evidence.
7. Official verifies and closes the complaint.
8. Citizen receives notifications and submits feedback.
9. Unauthorized users are prevented from accessing restricted dashboards.

## 13. Security Considerations

- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Protected backend routes.
- Input validation and sanitization.
- Secure image upload validation.
- Environment variable protection.
- Authorization checks for complaint ownership and worker assignments.
- Rate limiting and secure HTTP headers.

## 14. Future Enhancements

Potential future improvements include:

- AI-powered image classification of civic issues.
- Multilingual support for regional languages.
- WhatsApp and SMS notifications.
- Predictive analysis of frequently affected areas.
- Automated worker allocation.
- Integration with official municipal service platforms.
- Mobile application for citizens and workers.
- GIS-based infrastructure monitoring.

## 15. Academic Information

| Field | Details |
|---|---|
| Project Title | Smart Civic Management System (SCMS) |
| Subject | Software Engineering |
| Development Methodology | Agile Software Development Model |
| Project Type | Full-Stack Web Application |
| Project Domain | Smart City / E-Governance / Civic Technology |
| Primary Objective | Digitize civic complaint reporting, municipal worker allocation, and public issue resolution |

## 16. Contributors

This project is developed collaboratively as part of a Software Engineering academic assignment.

- [Ashmitha](https://github.com/Ashmitha148)
- [Akshara](https://github.com/aksharanallamothu)

---

## Vision

Making cities smarter by making civic services more accessible, transparent, and accountable.

**Report. Assign. Resolve. Improve.**
