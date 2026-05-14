import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CalendarDays, Clock3, MapPin, UserRound } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import '../../styles/DoctorPages.css';

const ScheduleDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/doctor/schedule');
        setAppointment(data.data.find((item) => item._id === id));
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [id]);

  if (loaded && !appointment) return <Navigate to="/doctor/schedule" replace />;
  if (!appointment) return <p className="muted-text">Loading appointment...</p>;

  return (
    <div className="doctor-page">
      <div className="doctor-page-head">
        <div>
          <h2>Consultation Details</h2>
          <p>Full appointment lifecycle and patient context.</p>
        </div>
        <Link to="/doctor/schedule" className="doc-secondary-btn">Back to schedule</Link>
      </div>

      <article className="doctor-card doc-details-card">
        <p><CalendarDays size={16} /> Date: {formatDateTime(appointment.startsAt)}</p>
        <p><Clock3 size={16} /> Duration: {appointment.durationMinutes} minutes</p>
        <p><UserRound size={16} /> Patient: {appointment.patient?.fullName || 'Patient'}</p>
        <p><MapPin size={16} /> Location: {appointment.room || 'Room pending'}</p>
        <p><strong>Status:</strong> {appointment.status}</p>
        {appointment.source === 'waitlist' && <p><strong>Source:</strong> Waitlist request</p>}
        {appointment.statusReason && <p><strong>Status reason:</strong> {appointment.statusReason}</p>}
        <p><strong>Reason:</strong> {appointment.reason || 'Not provided'}</p>
        {appointment.statusHistory?.length > 0 && (
          <div className="status-history">
            <h3>Status History</h3>
            {appointment.statusHistory.map((item, index) => (
              <p key={`${item.toStatus}-${index}`}>
                <strong>{item.toStatus}</strong>
                {item.reason ? ` - ${item.reason}` : ''}
              </p>
            ))}
          </div>
        )}
      </article>
    </div>
  );
};

export default ScheduleDetails;
