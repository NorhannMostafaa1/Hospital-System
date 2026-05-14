import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarDays, Clock3, Stethoscope, UserRound } from 'lucide-react';
import { api, formatDateInput, formatDateTime } from '../../services/api';
import '../../styles/PatientPages.css';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({
    doctorId: '',
    appointmentType: 'consultation',
    date: formatDateInput(),
    reason: '',
  });
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loading, setLoading] = useState(true);
  const [slotLoading, setSlotLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === form.doctorId),
    [doctors, form.doctorId]
  );

  const appointmentTypes = selectedDoctor?.doctorProfile?.appointmentTypes?.length
    ? selectedDoctor.doctorProfile.appointmentTypes
    : [{ code: 'consultation', label: 'Consultation', durationMinutes: 30 }];

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const { data } = await api.get('/patient/doctors');
        setDoctors(data.data);
        if (data.data[0]) {
          setForm((prev) => ({ ...prev, doctorId: data.data[0]._id }));
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!form.doctorId || !form.date) return;
      setSlotLoading(true);
      setError('');
      setMessage('');
      setSelectedSlot('');
      try {
        const { data } = await api.get('/patient/time-slots', {
          params: {
            doctorId: form.doctorId,
            from: form.date,
            appointmentType: form.appointmentType,
          },
        });
        setSlots(data.data);
      } catch (err) {
        setSlots([]);
        setError(err.message);
        toast.error(err.message);
      } finally {
        setSlotLoading(false);
      }
    };
    loadSlots();
  }, [form.doctorId, form.date, form.appointmentType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available slot.');
      toast.error('Please select an available slot.');
      return;
    }
    setError('');
    setMessage('');
    try {
      await api.post('/patient/appointments', {
        doctorId: form.doctorId,
        appointmentType: form.appointmentType,
        startsAt: selectedSlot,
        reason: form.reason,
      });
      toast.success('Appointment request created.');
      navigate('/patient/appointments');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const joinWaitlist = async () => {
    setError('');
    setMessage('');
    try {
      await api.post('/patient/waitlist', {
        doctorId: form.doctorId,
        appointmentType: form.appointmentType,
        desiredDate: form.date,
        reason: form.reason,
      });
      setMessage('You are now on the waitlist for this doctor and date.');
      toast.success('You joined the waitlist.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  return (
    <div className="patient-page">
      <div className="patient-page-head">
        <div>
          <h2>Appointment Booking</h2>
          <p>Choose a doctor, appointment type, and a live available slot.</p>
        </div>
        <Link className="page-secondary-btn" to="/patient/appointments">Back</Link>
      </div>

      <form className="page-card booking-card booking-form" onSubmit={handleBooking}>
        {error && <p className="page-alert error">{error}</p>}
        {message && <p className="page-alert success">{message}</p>}

        <div className="form-grid">
          <label className="page-field">
            <span><UserRound size={15} /> Doctor</span>
            <select name="doctorId" value={form.doctorId} onChange={handleChange} disabled={loading}>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.fullName} - {doctor.doctorProfile?.specialization || 'General'}
                </option>
              ))}
            </select>
          </label>

          <label className="page-field">
            <span><Stethoscope size={15} /> Appointment Type</span>
            <select name="appointmentType" value={form.appointmentType} onChange={handleChange}>
              {appointmentTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.label} ({type.durationMinutes}m)
                </option>
              ))}
            </select>
          </label>

          <label className="page-field">
            <span><CalendarDays size={15} /> Date</span>
            <input name="date" type="date" min={formatDateInput()} value={form.date} onChange={handleChange} />
          </label>

          <label className="page-field">
            <span>Reason</span>
            <input name="reason" value={form.reason} onChange={handleChange} placeholder="e.g. Follow-up visit" />
          </label>
        </div>

        <div className="slot-section">
          <h3><Clock3 size={17} /> Available Slots</h3>
          {slotLoading && <p className="muted-text">Loading slots...</p>}
          {!slotLoading && slots.length === 0 && (
            <div className="empty-state">
              <p>No available slots for this date.</p>
              <button type="button" className="page-secondary-btn" onClick={joinWaitlist}>Join Waitlist</button>
            </div>
          )}
          <div className="slot-grid">
            {slots.map((slot) => (
              <button
                type="button"
                key={slot.startsAt}
                className={selectedSlot === slot.startsAt ? 'slot-btn active' : 'slot-btn'}
                onClick={() => setSelectedSlot(slot.startsAt)}
              >
                {formatDateTime(slot.startsAt)}
              </button>
            ))}
          </div>
        </div>

        <div className="booking-actions">
          <button className="page-primary-btn" type="submit">Confirm Booking</button>
          <Link className="page-secondary-btn" to="/patient/appointments">Cancel</Link>
        </div>
      </form>
    </div>
  );
};

export default AppointmentBooking;
