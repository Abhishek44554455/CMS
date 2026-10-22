import { Navigate, Route, Routes } from 'react-router-dom';

import AdminLayout from './components/layout/AdminLayout.jsx';

// Admin pages
import Analytics from './pages/Analytics.jsx';
import AIInsights from './pages/AIInsights.jsx';
import ComplaintDetails from './pages/ComplaintDetails.jsx';
import Complaints from './pages/Complaints.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Escalated from './pages/Escalated.jsx';
import Institutions from './pages/Institutions.jsx';
import Officers from './pages/Officers.jsx';
import Settings from './pages/Settings.jsx';

// Public pages
import ComplaintSubmission from './pages/ComplaintSubmission.jsx';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import TrackComplaint from './pages/TrackComplaint.jsx';

import './App.css';

/**
 * Route map:
 *   /                      LandingPage
 *   /submit-complaint      ComplaintSubmission
 *   /track                 TrackComplaint
 *   /login                 Login
 *   /admin                 Dashboard        (AdminLayout shell)
 *   /admin/complaints      Complaints
 *   /admin/complaints/:id  ComplaintDetails
 *   /admin/escalated       Escalated
 *   /admin/institutions    Institutions
 *   /admin/officers        Officers
 *   /admin/analytics       Analytics
 *   /admin/ai-insights     AIInsights
 *   /admin/settings        Settings
 */
export default function App() {
  return (
    <Routes>
      {/* Public website */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/submit-complaint" element={<ComplaintSubmission />} />
      <Route path="/track" element={<TrackComplaint />} />
      <Route path="/login" element={<Login />} />

      {/* Admin application */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="complaints/:id" element={<ComplaintDetails />} />
        <Route path="escalated" element={<Escalated />} />
        <Route path="institutions" element={<Institutions />} />
        <Route path="officers" element={<Officers />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="ai-insights" element={<AIInsights />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Unknown routes → home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
