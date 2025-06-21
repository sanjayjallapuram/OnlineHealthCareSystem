import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import VideoCall from './components/VideoCall';

// Pages

import DoctorDashboard from './pages/DoctorDashboard';
import PatientDashboard from './pages/PatientDashboard';
import Appointments from './pages/Appointments';
import MedicalRecords from './pages/MedicalRecords';
import AddMedicalRecord from './pages/AddMedicalRecord';
import LandingPage from './pages/LandingPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import PatientRegister from './pages/PatientRegister';
import PatientLogin from './pages/PatientLogin';
import DoctorLogin from './pages/DoctorLogin';
import DoctorRegister from './pages/DoctorRegister';

// Create theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

// Component to handle authenticated user redirection
const AuthRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return null; // Let the loading be handled by the parent
  }
  
  if (isAuthenticated) {
    if (user?.roles?.includes('ROLE_DOCTOR')) {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (user?.roles?.includes('ROLE_PATIENT')) {
      return <Navigate to="/patient-dashboard" replace />;
    }
  }
  
  return <LandingPage />;
};

// 404 Page Component
const NotFound = () => {
  const { isAuthenticated, user } = useAuth();
  
  if (isAuthenticated) {
    // Redirect to appropriate dashboard if authenticated
    if (user?.roles?.includes('ROLE_DOCTOR')) {
      return <Navigate to="/doctor-dashboard" replace />;
    } else if (user?.roles?.includes('ROLE_PATIENT')) {
      return <Navigate to="/patient-dashboard" replace />;
    }
  }
  
  return <Navigate to="/" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<AuthRedirect />} />
                <Route path="/patient-login" element={<PatientLogin />} />
                <Route path="/patient-register" element={<PatientRegister />} />
                <Route path="/doctor-login" element={<DoctorLogin />} />
                <Route path="/doctor-register" element={<DoctorRegister />} />

                {/* Protected routes */}
                <Route
                  path="/doctor-dashboard"
                  element={
                    <ProtectedRoute roles={['ROLE_DOCTOR']}>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/patient-dashboard"
                  element={
                    <ProtectedRoute roles={['ROLE_PATIENT']}>
                      <PatientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <ProtectedRoute roles={['ROLE_DOCTOR', 'ROLE_PATIENT']}>
                      <Appointments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-records"
                  element={
                    <ProtectedRoute roles={['ROLE_DOCTOR', 'ROLE_PATIENT']}>
                      <MedicalRecords />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/add-medical-record/:id"
                  element={
                    <ProtectedRoute roles={['ROLE_DOCTOR']}>
                      <AddMedicalRecord />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/medical-records/edit/:id"
                  element={
                    <ProtectedRoute roles={['ROLE_DOCTOR']}>
                      <AddMedicalRecord />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-call/:roomId"
                  element={
                    <ProtectedRoute roles={['ROLE_DOCTOR', 'ROLE_PATIENT']}>
                      <VideoCall />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App; 