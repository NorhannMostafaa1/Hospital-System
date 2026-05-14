import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Users, CalendarDays, FileClock, Clock3 } from 'lucide-react';
import { api } from '../../services/api';
import '../../styles/DoctorPages.css';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);

  useEffect(() => {
    Promise.allSettled([api.get('/doctor/schedule'), api.get('/doctor/waitlist')]).then(([schedule, waiting]) => {
      setAppointments(schedule.status === 'fulfilled' ? schedule.value.data.data : []);
      setWaitlist(waiting.status === 'fulfilled' ? waiting.value.data.data : []);
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter((item) => item.startsAt?.slice(0, 10) === today);
  const waiting = appointments.filter((item) => item.status === 'pending');
  const confirmed = appointments.filter((item) => item.status === 'confirmed');
  const completed = appointments.filter((item) => item.status === 'completed');

  return (
    <div className="doctor-page">
      <div className="doctor-page-head">
        <div>
          <h2>Doctor Overview</h2>
          <p>Track your day, patient load, and upcoming consultations.</p>
        </div>
      </div>

      <div className="doctor-stats-grid">
        <article className="doctor-stat-card"><Activity size={18} /> {todayAppointments.length} Consultations Today</article>
        <article className="doctor-stat-card"><Users size={18} /> {waiting.length} Pending Requests</article>
        <article className="doctor-stat-card"><CalendarDays size={18} /> {confirmed.length} Confirmed Visits</article>
        <article className="doctor-stat-card"><FileClock size={18} /> {completed.length} Ready For Records</article>
        <article className="doctor-stat-card"><Clock3 size={18} /> {waitlist.length} Waitlist Patients</article>
      </div>

      <div className="doctor-actions">
        <button className="doc-primary-btn" onClick={() => navigate('/doctor/schedule')}>Open Schedule</button>
        <button className="doc-secondary-btn" onClick={() => navigate('/doctor/patients')}>View Patients</button>
        <button className="doc-secondary-btn" onClick={() => navigate('/doctor/settings')}>Open Settings</button>
      </div>
    </div>
  );
};

export default DoctorDashboard;
