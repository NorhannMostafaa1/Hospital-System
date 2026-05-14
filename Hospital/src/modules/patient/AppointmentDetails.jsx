import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CalendarDays, Clock3, MapPin, MessageSquareText, Stethoscope } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import '../../styles/PatientPages.css';

const AppointmentDetails = () => {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/patient/appointments');
        setAppointment(data.data.find((item) => item._id === id));
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, [id]);

  if (loaded && !appointment) return <Navigate to="/patient/appointments" replace />;
  if (!appointment) return <p className="muted-text">Loading appointment...</p>;

  return (
    <div className="patient-page">
      <div className="patient-page-head">
        <div>
          <h2>Appointment Details</h2>
          <p>Review lifecycle status and visit information.</p>
        </div>
        <Link className="page-secondary-btn" to="/patient/appointments">Back to bookings</Link>
      </div>

      <article className="page-card details-card">
        <div className="card-top">
          <h3>{appointment.doctor?.fullName || 'Doctor'}</h3>
          <span className={`pill status-${appointment.status}`}>{appointment.status}</span>
        </div>
        <p className="details-specialty"><Stethoscope size={16} /> {appointment.specialty || appointment.appointmentType}</p>
        <p><CalendarDays size={16} /> {formatDateTime(appointment.startsAt)}</p>
        <p><Clock3 size={16} /> {appointment.durationMinutes} minutes</p>
        <p><MapPin size={16} /> {appointment.room || 'Room pending'}</p>
        {appointment.source === 'waitlist' && <p><strong>Source:</strong> Waitlist request</p>}
        <p><strong>Reason:</strong> {appointment.reason || 'Not provided'}</p>
        {appointment.statusReason && <p><MessageSquareText size={16} /> <strong>Status reason:</strong> {appointment.statusReason}</p>}
        {appointment.cancellation?.reason && <p><strong>Cancellation:</strong> {appointment.cancellation.reason}</p>}
        {appointment.reschedule?.reason && <p><strong>Reschedule:</strong> {appointment.reschedule.reason}</p>}
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

export default AppointmentDetails;
