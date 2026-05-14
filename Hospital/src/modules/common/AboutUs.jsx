import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/WelcomePages.css';

const AboutUs = () => {
  return (
    <div className="welcome-page about-page">
      <div className="welcome-card about-card">
        <p className="welcome-badge">About Us</p>
        <h1>Modern Hospital Care</h1>
        <p>
          We provide connected digital healthcare for both patients and doctors through secure,
          simple, and efficient workflows.
        </p>

        <div className="about-hero-strip">
          <span>Patient-Centered</span>
          <span>Clinical Efficiency</span>
          <span>Digital Trust</span>
        </div>

        <div className="about-grid">
          <article>
            <h3>Patient First</h3>
            <p>Fast appointments, easy record access, and clear communication.</p>
          </article>
          <article>
            <h3>Doctor Tools</h3>
            <p>Schedule control, patient insights, and streamlined consultation details.</p>
          </article>
          <article>
            <h3>Trusted Security</h3>
            <p>Role-based portals and protected health data workflows.</p>
          </article>
        </div>

        <div className="welcome-actions">
          <Link to="/patient/welcome" className="welcome-btn secondary">Patient Welcome</Link>
          <Link to="/doctor/welcome" className="welcome-btn secondary">Doctor Welcome</Link>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
