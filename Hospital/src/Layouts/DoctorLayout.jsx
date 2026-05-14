// src/layouts/DoctorLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UsersRound, Clock3, Settings2, LogOut, PhoneCall, ShieldAlert } from 'lucide-react';
import { clearSession } from '../services/api';
import NotificationCenter from '../components/NotificationCenter';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import '../styles/DoctorLayout.css';

const DoctorLayout = () => {
  const navigate = useNavigate();
  const emergencyNumber = '123';

  const handleLogout = () => {
    clearSession('doctor');
    navigate('/doctor/login');
  };

  return (
    <div className="doctor-container">
      {/* Slim Professional Sidebar */}
      <aside className="doctor-sidebar">
        <div className="dr-logo">
          <div className="logo-icon">H+</div>
        </div>

        <nav className="dr-nav">
          <NavLink title="Dashboard" to="/doctor/dashboard" className={({ isActive }) => isActive ? "dr-link active" : "dr-link"}>
            <LayoutDashboard size={22} />
            <span className="dr-label">Dashboard</span>
          </NavLink>
          <NavLink title="Patients" to="/doctor/patients" className={({ isActive }) => isActive ? "dr-link active" : "dr-link"}>
            <UsersRound size={22} />
            <span className="dr-label">Patients</span>
          </NavLink>
          <NavLink title="Schedule" to="/doctor/schedule" className={({ isActive }) => isActive ? "dr-link active" : "dr-link"}>
            <Clock3 size={22} />
            <span className="dr-label">Schedule</span>
          </NavLink>
        </nav>

        <div className="dr-settings">
          <NavLink title="Settings" to="/doctor/settings" className={({ isActive }) => isActive ? "dr-link active" : "dr-link"}>
            <Settings2 size={22} />
            <span className="dr-label">Settings</span>
          </NavLink>
        </div>
      </aside>

      <div className="doctor-body">
        <header className="doctor-header">
          <div className="status-indicator">
            <span className="dot online"></span>
            <span className="status-text">On Duty</span>
          </div>
          
          <div className="header-actions">
            <NotificationCenter role="doctor" />
            <Dialog>
              <DialogTrigger asChild>
                <button className="emergency-btn"><PhoneCall size={16} /> Emergency Call</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Emergency Contact</DialogTitle>
                  <DialogDescription>Use the hospital emergency line below. This dialog avoids browser app handoffs and keeps you inside the portal.</DialogDescription>
                </DialogHeader>
                <div className="emergency-dialog-card">
                  <ShieldAlert size={24} />
                  <div>
                    <span>Emergency Line</span>
                    <strong>{emergencyNumber}</strong>
                  </div>
                </div>
                <DialogFooter>
                  <button className="doc-secondary-btn" type="button" onClick={() => navigate('/doctor/schedule')}>
                    Open Schedule
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="doctor-logout-btn"><LogOut size={16} /> Logout</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out of doctor portal?</AlertDialogTitle>
                  <AlertDialogDescription>Your schedule stays saved. You can sign back in when needed.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Stay Logged In</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>

        <main className="doctor-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout;
