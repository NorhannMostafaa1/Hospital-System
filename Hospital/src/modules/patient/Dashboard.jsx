import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, FileText, ChevronRight } from 'lucide-react';
import { api, formatDateTime, getCurrentUser } from '../../services/api';
import '../../styles/Dashboard.css';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [appointments, setAppointments] = useState([]);
  const [records, setRecords] = useState([]);

  useEffect(() => {
    Promise.allSettled([api.get('/patient/appointments'), api.get('/patient/records')]).then(([a, r]) => {
      if (a.status === 'fulfilled') setAppointments(a.value.data.data);
      if (r.status === 'fulfilled') setRecords(r.value.data.data);
    });
  }, []);

  const nextAppointment = appointments.find((item) => ['pending', 'confirmed'].includes(item.status));

  return (
    <div className="dashboard-fade-in">
      <header className="welcome-section">
        <h1>Good Morning, {user?.fullName?.split(' ')[0] || 'Patient'}</h1>
        <p>You have {appointments.length} appointments in your care timeline.</p>
      </header>

      <div className="stats-grid">
        <StatCard icon={<Activity color="#2563eb" />} label="Heart Rate" value="72 bpm" status="Normal" />
        <StatCard icon={<Clock color="#f59e0b" />} label="Next Visit" value={nextAppointment ? formatDateTime(nextAppointment.startsAt) : 'None'} status={nextAppointment?.status || 'No booking'} />
        <StatCard icon={<FileText color="#22c55e" />} label="Records" value={String(records.length)} status="Available" />
      </div>

      <div className="main-grid">
        <div className="glass-card upcoming-box">
          <div className="card-header">
            <h3>Upcoming Appointment</h3>
            <button className="text-btn" onClick={() => navigate('/patient/appointments')}>View All</button>
          </div>
          {nextAppointment ? (
            <button className="appointment-item appointment-item-btn" onClick={() => navigate(`/patient/appointments/${nextAppointment._id}`)}>
              <div className="date-badge">
                <span className="month">{new Date(nextAppointment.startsAt).toLocaleString('en', { month: 'short' }).toUpperCase()}</span>
                <span className="day">{new Date(nextAppointment.startsAt).getDate()}</span>
              </div>
              <div className="details">
                <h4>{nextAppointment.doctor?.fullName || 'Doctor'}</h4>
                <p>{nextAppointment.appointmentType} - {nextAppointment.status}</p>
              </div>
              <ChevronRight className="arrow" />
            </button>
          ) : (
            <p className="muted-text">No upcoming appointment.</p>
          )}
        </div>

        <div className="glass-card actions-box">
          <h3>Quick Actions</h3>
          <div className="action-btns">
            <button className="primary-action" onClick={() => navigate('/patient/appointments/new')}>Book Appointment</button>
            <button className="secondary-action" onClick={() => navigate('/patient/records')}>View Records</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, status }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{status}</small>
    </div>
  </div>
);

export default PatientDashboard;
