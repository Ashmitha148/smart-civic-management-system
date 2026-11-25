import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROLES } from './constants/civicConstants';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CitizenDashboard from './pages/CitizenDashboard';
import SubmitComplaintPage from './pages/SubmitComplaintPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ComplaintDetailsPage from './pages/ComplaintDetailsPage';
import NotFoundPage from './pages/NotFoundPage';

// Phase 2: Admin (Government Official) & Municipal Worker Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage';
import AdminComplaintDetailPage from './pages/admin/AdminComplaintDetailPage';
import AdminWorkersPage from './pages/admin/AdminWorkersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminHeatmapPage from './pages/admin/AdminHeatmapPage';
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerTasksPage from './pages/worker/WorkerTasksPage';
import WorkerTaskDetailPage from './pages/worker/WorkerTaskDetailPage';

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <div className="min-h-screen flex flex-col bg-slate-50">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Citizen Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                      <CitizenDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complaints"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                      <MyComplaintsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complaints/new"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                      <SubmitComplaintPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/complaints/:id"
                  element={
                    <ProtectedRoute
                      allowedRoles={[ROLES.CITIZEN, ROLES.OFFICIAL, ROLES.WORKER]}
                    >
                      <ComplaintDetailsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin (Government Official) Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICIAL]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/complaints"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICIAL]}>
                      <AdminComplaintsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/complaints/:id"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICIAL]}>
                      <AdminComplaintDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/workers"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICIAL]}>
                      <AdminWorkersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICIAL]}>
                      <AdminAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/heatmap"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICIAL]}>
                      <AdminHeatmapPage />
                    </ProtectedRoute>
                  }
                />

                {/* Municipal Worker Routes */}
                <Route
                  path="/worker"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WORKER]}>
                      <WorkerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/worker/tasks"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WORKER]}>
                      <WorkerTasksPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/worker/tasks/:id"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WORKER]}>
                      <WorkerTaskDetailPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
