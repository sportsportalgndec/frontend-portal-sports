// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoadingProvider } from './contexts/LoadingContext';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminSessionManager from './pages/AdminSessionManager';
import ProtectedRoute from './components/ProtectedRoute';
import AdminApprovalDashboard from './pages/AdminApprovalDashboard';
import StudentProfileForm from './pages/StudentProfileForm';
import CaptainDashboard from './pages/CaptainDashboard';
import CreateStudent from './pages/CreateStudent';
import CreateTeacher from './pages/CreateTeacher';
import CreateCaptain from './pages/CreateCaptain';
import StudentDetails from './pages/StudentDetails';
import CaptainsAndTeams from "./pages/CaptainsAndTeams";
import AllStudents from './pages/AllStudents';
import GymAttendanceDashboard from './pages/GymAttendanceDashboard';
import SwimmingAttendanceDashboard from './pages/SwimmingAttendanceDashboard';
import AdminAssignPosition from './pages/AdminAssignPosition';
import AssignPosition from './pages/AssignPosition';
import StudentExport from './pages/Export';
import CaptainExport from './pages/CaptainExport';
import Certificate from './pages/Certificate';
import CaptainListCert from './pages/CaptainListCert';
import StudentsTable from './pages/Scorematrix';
import AdminLayout from './components/AdminLayout';
import EligibilityPDF from './pages/EligibiliyPDF';
import DevelopmentTeam from './pages/DevelopmentTeam';

function App() {
  return (
    <ThemeProvider>
      <LoadingProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/student" element={<StudentProfileForm />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/captain" element={<CaptainDashboard />} />
          <Route path="/development-team" element={<DevelopmentTeam />} />
          {/* Admin routes with persistent sidebar */}
          <Route element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
            <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/students" element={<AllStudents />} />
            <Route path="/admin/captains" element={<CaptainsAndTeams />} />
            <Route path="/admin/student/:id" element={<StudentDetails />} />
            <Route path="/admin/gym-attendance" element={<GymAttendanceDashboard />} />
            <Route path="/admin/swimming-attendance" element={<SwimmingAttendanceDashboard />} />
            <Route path="/admin/export-captains" element={<CaptainExport />} />
            <Route path="/admin/export" element={<StudentExport />} />
            <Route path="/admin/certificates/:captainId" element={<Certificate />} />
            <Route path="/admin/score" element={<StudentsTable />} />
            <Route path="/admin/issue-cert" element={<CaptainListCert />} />
            <Route path="/admin/create-student" element={<CreateStudent />} />
            <Route path="/admin/create-teacher" element={<CreateTeacher />} />
            <Route path="/admin/create-captain" element={<CreateCaptain />} />
            <Route path="/admin/assign-team-position" element={<AssignPosition/>} />
            <Route path="/admin/approvals" element={<AdminApprovalDashboard />} />
            <Route path="/admin/assign-position" element={<AdminAssignPosition />} />
            <Route path="/admin/session" element={<AdminSessionManager />} />
            <Route path="/admin/pdf" element={<EligibilityPDF />} />
            
          </Route>
          </Routes>
        </BrowserRouter>
      </LoadingProvider>
    </ThemeProvider>
  );
}

export default App;
