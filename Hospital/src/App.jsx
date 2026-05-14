import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import PatientLayout from './Layouts/PatientLayout';
import DoctorLayout from './Layouts/DoctorLayout';

// Pages & Modules
import AuthUp from './modules/patient/authup';
import AuthIn from './modules/patient/authin';
import PatientDashboard from './modules/patient/Dashboard'; // Import the new Dashboard
import PatientAppointments from './modules/patient/Appointments';
import PatientRecords from './modules/patient/Records';
import PatientProfile from './modules/patient/Profile';
import AppointmentDetails from './modules/patient/AppointmentDetails';
import AppointmentBooking from './modules/patient/AppointmentBooking';
import DoctorDashboard from './modules/doctor/Dashboard';
import DoctorSchedule from './modules/doctor/Schedule';
import DoctorPatients from './modules/doctor/Patients';
import DoctorSettings from './modules/doctor/Settings';
import ScheduleDetails from './modules/doctor/ScheduleDetails';
import PatientDetails from './modules/doctor/PatientDetails';
import DoctorAuthUp from './modules/doctor/authup';
import PatientWelcome from './modules/patient/Welcome';
import DoctorWelcome from './modules/doctor/Welcome';
import AboutUs from './modules/common/AboutUs';

// --- Scroll to Top Helper ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- Temporary Placeholder for remaining sub-pages ---
const Placeholder = ({ title }) => (
  <div style={{ 
    padding: '60px 20px', 
    textAlign: 'center', 
    backgroundColor: 'white',
    border: '2px dashed var(--border)', 
    borderRadius: '24px' 
  }}>
    <h2 style={{ color: 'var(--accent)', marginBottom: '10px' }}>{title}</h2>
    <p style={{ color: 'var(--text)' }}>This section is currently under development.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '12px',
            border: '1px solid #dbe6f2',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.12)',
            color: '#0f172a',
            fontWeight: 600,
          },
        }}
      />
      <ScrollToTop />
      <Routes>
        {/* --- Public Auth Routes --- */}
        <Route path="/signup" element={<AuthUp />} />
        <Route path="/login" element={<AuthIn />} />
        <Route path="/doctor/signup" element={<DoctorAuthUp />} />
        <Route path="/doctor/login" element={<AuthIn />} />
        <Route path="/patient/welcome" element={<PatientWelcome />} />
        <Route path="/doctor/welcome" element={<DoctorWelcome />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/forgot-password" element={<Placeholder title="Forgot Password" />} />

        {/* --- Patient Portal --- */}
        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          {/* Replaced Placeholder with the real Dashboard */}
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="appointments/new" element={<AppointmentBooking />} />
          <Route path="appointments/:id" element={<AppointmentDetails />} />
          <Route path="records" element={<PatientRecords />} />
          <Route path="profile" element={<PatientProfile />} />
        </Route>

        {/* --- Doctor Portal --- */}
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="schedule" element={<DoctorSchedule />} />
          <Route path="schedule/:id" element={<ScheduleDetails />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="settings" element={<DoctorSettings />} />
        </Route>

        {/* --- Catch-All --- */}
        <Route path="/" element={<Navigate to="/patient/welcome" replace />} />
        <Route path="*" element={<Navigate to="/patient/welcome" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
