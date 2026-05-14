import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/WelcomePages.css';

const DoctorWelcome = () => {
  return (
    <div className="welcome-page doctor-welcome">
      <div className="welcome-card">
        <p className="welcome-badge">Doctor Portal</p>
        <h1>Care With Confidence</h1>
        <p>
          Manage schedule, access patient files, and deliver better care from one dashboard.
        </p>

        <div className="welcome-highlights">
          <article><strong>Smart</strong><span>Consultation workflow</span></article>
          <article><strong>Unified</strong><span>Patient history visibility</span></article>
          <article><strong>Reliable</strong><span>Clinical data access</span></article>
        </div>

        <div className="welcome-actions">
          <Link to="/doctor/login" className="welcome-btn primary">Sign In</Link>
          <Link to="/doctor/signup" className="welcome-btn secondary">Sign Up</Link>
          <Link to="/about-us" className="welcome-btn ghost">About Us</Link>
        </div>
        <p className="welcome-switch">Patient? <Link to="/patient/welcome">Open patient welcome</Link></p>
      </div>
    </div>
  );
};

export default DoctorWelcome;
