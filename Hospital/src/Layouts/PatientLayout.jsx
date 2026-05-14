// src/layouts/PatientLayout.jsx
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { House, CalendarCheck2, FileHeart, UserCircle2, LogOut } from 'lucide-react';
import { clearSession, getCurrentUser } from '../services/api';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import '../styles/PatientLayout.css';

const PatientLayout = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    clearSession('patient');
    navigate('/login');
  };

  return (
    <div className="patient-container">
      {/* Sidebar Navigation */}
      <aside className="patient-sidebar">
        <div className="sidebar-logo">
          <h2>Health<span>Center</span></h2>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink title="Dashboard" to="/patient/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <House size={20} /> <span>Dashboard</span>
          </NavLink>
          <NavLink title="Appointments" to="/patient/appointments" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <CalendarCheck2 size={20} /> <span>Appointments</span>
          </NavLink>
          <NavLink title="Records" to="/patient/records" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <FileHeart size={20} /> <span>Records</span>
          </NavLink>
          <NavLink title="Profile" to="/patient/profile" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
            <UserCircle2 size={20} /> <span>Profile</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button title="Logout" className="logout-btn">
                <LogOut size={20} /> <span>Logout</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>You can sign back in at any time to continue managing appointments.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay Logged In</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="patient-main">
        <header className="patient-header">
          <div className="user-profile-header">
            <NotificationCenter role="patient" />
            <div className="user-info">
              <p className="welcome-text">Welcome back,</p>
              <p className="user-name">{user?.fullName || 'Patient'}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="avatar avatar-button">{(user?.fullName || 'P').charAt(0).toUpperCase()}</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate('/patient/profile')}>
                  <UserCircle2 size={15} /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/patient/appointments')}>
                  <CalendarCheck2 size={15} /> Appointments
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <section className="content-wrapper">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default PatientLayout;
