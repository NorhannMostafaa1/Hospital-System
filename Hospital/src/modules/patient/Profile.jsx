import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Phone, Mail, Droplet } from 'lucide-react';
import '../../styles/PatientPages.css';

const PatientProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="patient-page">
      <div className="patient-page-head">
        <div>
          <h2>Profile</h2>
          <p>Keep your personal and emergency information up to date.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="page-card">
          <h3>Personal Information</h3>
          <div className="profile-field"><UserRound size={16} /> Ahmed Mohamed</div>
          <div className="profile-field"><Mail size={16} /> ahmed@example.com</div>
          <div className="profile-field"><Phone size={16} /> +20 10 1234 5678</div>
        </section>

        <section className="page-card">
          <h3>Medical Snapshot</h3>
          <div className="profile-field"><Droplet size={16} /> Blood Group: O+</div>
          <div className="profile-field">Allergies: Penicillin</div>
          <div className="profile-field">Chronic Conditions: Hypertension</div>
        </section>
      </div>

      <button className="page-primary-btn save-btn" onClick={() => navigate('/patient/dashboard')}>Save changes</button>
    </div>
  );
};

export default PatientProfile;
