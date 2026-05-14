import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserRound } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import '../../styles/DoctorPages.css';

const DoctorPatients = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/doctor/schedule')
      .then(({ data }) => setAppointments(data.data))
      .catch((err) => setError(err.message));
  }, []);

  const patients = useMemo(() => {
    const byId = new Map();
    appointments.forEach((appointment) => {
      if (!appointment.patient?._id) return;
      const current = byId.get(appointment.patient._id);
      if (!current || new Date(appointment.startsAt) > new Date(current.lastVisit)) {
        byId.set(appointment.patient._id, {
          id: appointment.patient._id,
          name: appointment.patient.fullName,
          email: appointment.patient.email,
          condition: appointment.appointmentType,
          lastVisit: appointment.startsAt,
          status: appointment.status,
        });
      }
    });
    return [...byId.values()];
  }, [appointments]);

  return (
    <div className="doctor-page">
      <div className="doctor-page-head">
        <div>
          <h2>Patient Database</h2>
          <p>Patients appear here once they have appointments with you.</p>
        </div>
        <button className="doc-secondary-btn" onClick={() => navigate('/doctor/schedule')}>
          <Search size={16} />
          Schedule Search
        </button>
      </div>

      {error && <p className="page-alert error">{error}</p>}
      {patients.length === 0 && <div className="doctor-card empty-state">No patient appointments yet.</div>}

      <div className="doctor-list">
        {patients.map((patient) => (
          <article key={patient.id} className="doctor-card doctor-patient-row">
            <div className="doctor-patient-main">
              <UserRound size={18} />
              <div>
                <h3>{patient.name}</h3>
                <p>{patient.email || 'No email'} - Last visit {formatDateTime(patient.lastVisit)}</p>
              </div>
            </div>
            <div className="doctor-patient-actions">
              <span className={`doc-pill status-${patient.status}`}>{patient.status}</span>
              <button className="doc-secondary-btn" onClick={() => navigate(`/doctor/patients/${patient.id}`)}>
                Open Timeline
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default DoctorPatients;
