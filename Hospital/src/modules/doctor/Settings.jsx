import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarOff, Save } from 'lucide-react';
import { api } from '../../services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import '../../styles/DoctorPages.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DoctorSettings = () => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [bufferMinutes, setBufferMinutes] = useState(10);
  const [unavailableOpen, setUnavailableOpen] = useState(false);
  const [unavailableForm, setUnavailableForm] = useState({ date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState(
    dayNames.map((_, dayOfWeek) => ({
      dayOfWeek,
      enabled: dayOfWeek === 1 || dayOfWeek === 6,
      windows: [{ start: '10:00', end: '16:00' }],
    }))
  );

  const setDayValue = (index, field, value) => {
    setSchedule((prev) =>
      prev.map((day, i) =>
        i === index
          ? {
              ...day,
              [field]: value,
            }
          : day
      )
    );
  };

  const setWindowValue = (index, field, value) => {
    setSchedule((prev) =>
      prev.map((day, i) =>
        i === index
          ? {
              ...day,
              windows: [{ ...(day.windows[0] || {}), [field]: value }],
            }
          : day
      )
    );
  };

  const saveSchedule = async () => {
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await api.patch('/doctor/settings/working-hours', {
        bufferMinutes: Number(bufferMinutes),
        weeklySchedule: schedule,
      });
      setMessage('Schedule saved. Existing future appointments are protected by backend freeze validation.');
      toast.success('Working hours saved.');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markUnavailable = async () => {
    if (!unavailableForm.date) {
      toast.error('Please choose the unavailable date.');
      return;
    }
    setMessage('');
    setError('');
    setSaving(true);
    try {
      await api.patch('/doctor/schedule/day-unavailable', {
        date: unavailableForm.date,
        unavailable: true,
        reason: unavailableForm.reason || 'Doctor unavailable',
      });
      setMessage('Unavailable day saved.');
      toast.success('Unavailable day saved.');
      setUnavailableOpen(false);
      setUnavailableForm({ date: '', reason: '' });
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="doctor-page">
      <div className="doctor-page-head">
        <div>
          <h2>Schedule Settings</h2>
          <p>Configure recurring working hours, buffer time, and unavailable days.</p>
        </div>
      </div>

      {error && <p className="page-alert error">{error}</p>}
      {message && <p className="page-alert success">{message}</p>}

      <div className="doctor-card settings-card schedule-settings-card">
        <label className="doctor-field">
          <span>Buffer between appointments</span>
          <input type="number" min="0" max="120" value={bufferMinutes} onChange={(e) => setBufferMinutes(e.target.value)} />
        </label>

        <div className="weekly-schedule-list">
          {schedule.map((day, index) => (
            <div key={day.dayOfWeek} className="schedule-row">
              <label>
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => setDayValue(index, 'enabled', e.target.checked)}
                />
                {dayNames[day.dayOfWeek]}
              </label>
              <input
                type="time"
                value={day.windows[0]?.start || '09:00'}
                disabled={!day.enabled}
                onChange={(e) => setWindowValue(index, 'start', e.target.value)}
              />
              <input
                type="time"
                value={day.windows[0]?.end || '17:00'}
                disabled={!day.enabled}
                onChange={(e) => setWindowValue(index, 'end', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="doctor-actions">
        <button className="doc-primary-btn" onClick={saveSchedule} disabled={saving}>
          <Save size={16} /> {saving ? 'Saving...' : 'Save Working Hours'}
        </button>
        <button className="doc-secondary-btn" onClick={() => setUnavailableOpen(true)}>
          <CalendarOff size={16} /> Mark Day Unavailable
        </button>
      </div>

      <Dialog open={unavailableOpen} onOpenChange={setUnavailableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Day Unavailable</DialogTitle>
            <DialogDescription>Block a day from patient booking and keep the reason visible in schedule history.</DialogDescription>
          </DialogHeader>
          <div className="dialog-form">
            <label className="doctor-field">
              <span>Date</span>
              <input
                type="date"
                value={unavailableForm.date}
                onChange={(e) => setUnavailableForm((prev) => ({ ...prev, date: e.target.value }))}
              />
            </label>
            <label className="doctor-field">
              <span>Reason</span>
              <textarea
                rows="4"
                value={unavailableForm.reason}
                onChange={(e) => setUnavailableForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="e.g. Conference, emergency leave, maintenance"
              />
            </label>
          </div>
          <DialogFooter>
            <button type="button" className="doc-secondary-btn" onClick={() => setUnavailableOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button type="button" className="doc-primary-btn" onClick={markUnavailable} disabled={saving}>
              {saving ? 'Saving...' : 'Save Unavailable Day'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSettings;
