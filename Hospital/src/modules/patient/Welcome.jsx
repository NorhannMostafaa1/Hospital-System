import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/WelcomePages.css';

const PatientWelcome = () => {
  return (
    <div className="welcome-page patient-welcome">
      <div className="welcome-card">
        <p className="welcome-badge">Patient Portal</p>
        <h1>Your Health, Organized</h1>
        <p>
          Book appointments, view records, and track your care journey in one secure place.
        </p>

        <div className="welcome-highlights">
          <article><strong>24/7</strong><span>Access to your profile</span></article>
          <article><strong>Fast</strong><span>Appointment booking flow</span></article>
          <article><strong>Secure</strong><span>Protected medical records</span></article>
        </div>

        <div className="welcome-actions">
          <Link to="/login" className="welcome-btn primary">Sign In</Link>
          <Link to="/signup" className="welcome-btn secondary">Sign Up</Link>
          <Link to="/about-us" className="welcome-btn ghost">About Us</Link>
        </div>
        <p className="welcome-switch">Doctor? <Link to="/doctor/welcome">Open doctor welcome</Link></p>
      </div>
    </div>
  );
};

export default PatientWelcome;
