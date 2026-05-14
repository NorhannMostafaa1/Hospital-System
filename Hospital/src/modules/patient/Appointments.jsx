import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Clock3, MapPin, Plus, RotateCcw, XCircle } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import '../../styles/PatientPages.css';

const PatientAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState({ type: '', appointmentId: '' });
  const [actionForm, setActionForm] = useState({ reason: '', startsAt: '' });
  const [submitting, setSubmitting] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patient/appointments');
      setAppointments(data.data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const openActionDialog = (type, appointmentId) => {
    setActionForm({ reason: '', startsAt: '' });
    setDialog({ type, appointmentId });
  };

  const closeActionDialog = () => {
    if (submitting) return;
    setDialog({ type: '', appointmentId: '' });
    setActionForm({ reason: '', startsAt: '' });
  };

  const cancelAppointment = async () => {
    if (!actionForm.reason.trim()) {
      toast.error('Please add a cancellation reason.');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/patient/appointments/${dialog.appointmentId}/cancel`, { reason: actionForm.reason });
      toast.success('Appointment cancellation submitted.');
      setDialog({ type: '', appointmentId: '' });
      setActionForm({ reason: '', startsAt: '' });
      loadAppointments();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const rescheduleAppointment = async () => {
    if (!actionForm.startsAt) {
      toast.error('Please choose a new date and time.');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch(`/patient/appointments/${dialog.appointmentId}/reschedule`, {
        startsAt: new Date(actionForm.startsAt).toISOString(),
        reason: actionForm.reason || 'Patient requested reschedule',
      });
      toast.success('Reschedule request submitted.');
      setDialog({ type: '', appointmentId: '' });
      setActionForm({ reason: '', startsAt: '' });
      loadAppointments();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="patient-page">
      <div className="patient-page-head">
        <div>
          <h2>Appointments</h2>
          <p>Live appointment history from the backend lifecycle engine.</p>
        </div>
        <button className="page-primary-btn" onClick={() => navigate('/patient/appointments/new')}>
          <Plus size={16} />
          New Booking
        </button>
      </div>

      {error && <p className="page-alert error">{error}</p>}
      {loading && <p className="muted-text">Loading appointments...</p>}
      {!loading && appointments.length === 0 && (
        <div className="page-card empty-state">
          <p>No appointments yet.</p>
          <button className="page-primary-btn" onClick={() => navigate('/patient/appointments/new')}>Book First Appointment</button>
        </div>
      )}

      <div className="page-grid">
        {appointments.map((item) => (
          <article key={item._id} className="page-card">
            <div className="card-top">
              <h3>{item.doctor?.fullName || 'Doctor'}</h3>
              <div className="pill-row">
                <span className={`pill status-${item.status}`}>{item.status}</span>
                {item.source === 'waitlist' && <span className="pill waitlist-source">From waitlist</span>}
              </div>
            </div>
            <div className="card-meta">
              <p><CalendarDays size={16} /> {formatDateTime(item.startsAt)}</p>
              <p><Clock3 size={16} /> {item.durationMinutes} minutes</p>
              <p><MapPin size={16} /> {item.room || 'Room pending'}</p>
              {item.statusReason && <p><strong>Status reason:</strong> {item.statusReason}</p>}
            </div>
            <div className="card-actions">
              <button className="page-secondary-btn" onClick={() => navigate(`/patient/appointments/${item._id}`)}>View Details</button>
              {['pending', 'confirmed'].includes(item.status) && (
                <>
                  <button className="page-secondary-btn" onClick={() => openActionDialog('reschedule', item._id)}>
                    <RotateCcw size={15} /> Reschedule
                  </button>
                  <button className="page-danger-btn" onClick={() => openActionDialog('cancel', item._id)}>
                    <XCircle size={15} /> Cancel
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>

      <Dialog open={Boolean(dialog.type)} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog.type === 'cancel' ? 'Cancel Appointment' : 'Reschedule Appointment'}</DialogTitle>
            <DialogDescription>
              {dialog.type === 'cancel'
                ? 'Share the reason for cancellation so the clinic can keep the care timeline accurate.'
                : 'Choose a new appointment time and add a short note for the clinic.'}
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-form">
            {dialog.type === 'reschedule' && (
              <label className="page-field">
                <span><CalendarDays size={15} /> New date and time</span>
                <input
                  type="datetime-local"
                  value={actionForm.startsAt}
                  onChange={(e) => setActionForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </label>
            )}
            <label className="page-field">
              <span>Reason</span>
              <textarea
                rows="4"
                value={actionForm.reason}
                onChange={(e) => setActionForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder={dialog.type === 'cancel' ? 'Why are you cancelling?' : 'Optional note for the doctor'}
              />
            </label>
          </div>

          <DialogFooter>
            <button type="button" className="page-secondary-btn" onClick={closeActionDialog} disabled={submitting}>
              Keep Appointment
            </button>
            <button
              type="button"
              className={dialog.type === 'cancel' ? 'page-danger-btn' : 'page-primary-btn'}
              onClick={dialog.type === 'cancel' ? cancelAppointment : rescheduleAppointment}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : dialog.type === 'cancel' ? 'Cancel Appointment' : 'Send Request'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientAppointments;
