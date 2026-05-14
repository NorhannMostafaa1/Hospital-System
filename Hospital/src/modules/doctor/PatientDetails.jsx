import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, FileText, UserRound } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import '../../styles/DoctorPages.css';

const PatientDetails = () => {
  const { id } = useParams();
  const [timeline, setTimeline] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/doctor/patients/${id}/timeline`)
      .then(({ data }) => setTimeline(data.data))
      .catch((err) => setError(err.message));
  }, [id]);

  return (
    <div className="doctor-page">
      <div className="doctor-page-head">
        <div>
          <h2>Patient Timeline</h2>
          <p>Appointments, records, and amendments scoped to your care relationship.</p>
        </div>
        <Link to="/doctor/patients" className="doc-secondary-btn">Back to patients</Link>
      </div>

      {error && <p className="page-alert error">{error}</p>}
      {timeline.length === 0 && <div className="doctor-card empty-state">No timeline items available.</div>}

      <div className="doctor-list">
        {timeline.map((item, index) => (
          <article key={`${item.type}-${index}`} className="doctor-card doctor-patient-row">
            <div className="doctor-patient-main">
              {item.type === 'medical_record' ? <FileText size={18} /> : <CalendarDays size={18} />}
              <div>
                <h3>{item.type.replaceAll('_', ' ')}</h3>
                <p>{formatDateTime(item.occurredAt)}</p>
              </div>
            </div>
            <div className="doctor-patient-actions">
              <UserRound size={16} />
              <span className="doc-pill">{item.data?.status || item.data?.diagnosis || 'history'}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default PatientDetails;
