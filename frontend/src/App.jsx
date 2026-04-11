import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SubmitWaste from './pages/SubmitWaste';
import FindFacilities from './pages/FindFacilities';
import TrackWaste from './pages/TrackWaste';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

// Recycler pages
import RecyclerDashboard from './pages/recycler/RecyclerDashboard';
import RecyclerRequests from './pages/recycler/RecyclerRequests';
import RecyclerRequestDetail from './pages/recycler/RecyclerRequestDetail';
import FacilitySetup from './pages/recycler/FacilitySetup';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminFacilities from './pages/admin/AdminFacilities';
import AdminRequests from './pages/admin/AdminRequests';

// Layout
import Layout from './components/Layout';

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'recycler') return <Navigate to="/recycler" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/track/:trackingId?" element={<TrackWaste />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* User routes */}
      <Route path="/dashboard" element={<ProtectedRoute roles={['individual', 'company']}><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/submit" element={<ProtectedRoute roles={['individual', 'company']}><Layout><SubmitWaste /></Layout></ProtectedRoute>} />
      <Route path="/facilities" element={<ProtectedRoute roles={['individual', 'company']}><Layout><FindFacilities /></Layout></ProtectedRoute>} />
      <Route path="/my-requests" element={<ProtectedRoute roles={['individual', 'company']}><Layout><MyRequests /></Layout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Layout><Notifications /></Layout></ProtectedRoute>} />

      {/* Recycler routes */}
      <Route path="/recycler" element={<ProtectedRoute roles={['recycler']}><Layout><RecyclerDashboard /></Layout></ProtectedRoute>} />
      <Route path="/recycler/requests" element={<ProtectedRoute roles={['recycler']}><Layout><RecyclerRequests /></Layout></ProtectedRoute>} />
      <Route path="/recycler/requests/:id" element={<ProtectedRoute roles={['recycler']}><Layout><RecyclerRequestDetail /></Layout></ProtectedRoute>} />
      <Route path="/recycler/facility" element={<ProtectedRoute roles={['recycler']}><Layout><FacilitySetup /></Layout></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><Layout><AdminUsers /></Layout></ProtectedRoute>} />
      <Route path="/admin/facilities" element={<ProtectedRoute roles={['admin']}><Layout><AdminFacilities /></Layout></ProtectedRoute>} />
      <Route path="/admin/requests" element={<ProtectedRoute roles={['admin']}><Layout><AdminRequests /></Layout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
