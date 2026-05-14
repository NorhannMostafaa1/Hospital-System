import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, ClipboardPlus, Clock3, FilePlus2, FileUp, SkipForward, UserRound, XCircle } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import '../../styles/DoctorPages.css';

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectDialog, setRejectDialog] = useState({ open: false, appointmentId: '' });
  const [waitlistDialog, setWaitlistDialog] = useState({ open: false, type: '', entry: null });
  const [recordSheet, setRecordSheet] = useState({ open: false, appointment: null });
  const [rejectReason, setRejectReason] = useState('');
  const [waitlistForm, setWaitlistForm] = useState({ startsAt: '', reason: '' });
  const [recordStep, setRecordStep] = useState(0);
  const [recordFile, setRecordFile] = useState(null);
  const [recordForm, setRecordForm] = useState({
    diagnosis: '',
    symptoms: '',
    medications: '',
    prescriptions: '',
    labResults: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const recordSteps = [
    { key: 'diagnosis', label: 'Diagnosis', placeholder: 'e.g. Migraine follow-up', required: true, rows: 1 },
    { key: 'symptoms', label: 'Symptoms', placeholder: 'Headache, nausea, light sensitivity', rows: 3 },
    { key: 'medications', label: 'Medications', placeholder: 'Ibuprofen\nParacetamol', rows: 3 },
    { key: 'prescriptions', label: 'Prescriptions', placeholder: 'Medicine name - dosage - frequency - duration', rows: 3 },
    { key: 'labResults', label: 'Lab results', placeholder: 'CBC normal\nMRI pending', rows: 3 },
    { key: 'notes', label: 'Clinical notes', placeholder: 'Summarize findings, treatment plan, and follow-up guidance', rows: 5 },
    { key: 'attachment', label: 'PDF attachment', placeholder: '', rows: 1 },
  ];

  const parseList = (value) =>
    value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const parsePrescriptions = (value) =>
    value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [medicineName, dosage = 'As directed', frequency = 'As directed', duration = 'As directed'] = line
          .split('-')
          .map((part) => part.trim())
          .filter(Boolean);
        return { medicineName, dosage, frequency, duration };
      });

  const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
  };

  const defaultWaitlistTime = (entry) => {
    if (entry.offeredSlot?.startsAt) return toDateTimeLocal(entry.offeredSlot.startsAt);
    if (!entry.desiredDate) return '';
    return `${String(entry.desiredDate).slice(0, 10)}T09:00`;
  };

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const [schedule, waiting] = await Promise.all([api.get('/doctor/schedule'), api.get('/doctor/waitlist')]);
      setAppointments(schedule.data.data);
      setWaitlist(waiting.data.data);
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

  const updateStatus = async (id, status, reason) => {
    setSubmitting(true);
    try {
      await api.patch(`/doctor/appointments/${id}/status`, { status, reason });
      toast.success(`Appointment marked ${status}.`);
      loadAppointments();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const submitRejection = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please add a rejection reason.');
      return;
    }
    await updateStatus(rejectDialog.appointmentId, 'rejected', rejectReason);
    setRejectDialog({ open: false, appointmentId: '' });
    setRejectReason('');
  };

  const openRecordSheet = (appointment) => {
    setRecordForm({ diagnosis: '', symptoms: '', medications: '', prescriptions: '', labResults: '', notes: '' });
    setRecordFile(null);
    setRecordStep(0);
    setRecordSheet({ open: true, appointment });
  };

  const moveRecordStep = (direction) => {
    setRecordStep((step) => Math.min(Math.max(step + direction, 0), recordSteps.length - 1));
  };

  const handleRecordKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    moveRecordStep(1);
  };

  const createRecord = async () => {
    if (!recordForm.diagnosis.trim()) {
      toast.error('Diagnosis is required.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/doctor/records', {
        appointment: recordSheet.appointment._id,
        diagnosis: recordForm.diagnosis,
        notes: recordForm.notes,
        symptoms: parseList(recordForm.symptoms),
        medications: parseList(recordForm.medications),
        prescriptions: parsePrescriptions(recordForm.prescriptions),
        labResults: parseList(recordForm.labResults),
        locked: true,
      });
      if (recordFile) {
        const formData = new FormData();
        formData.append('files', recordFile);
        await api.post(`/records/${data.data._id}/attachments`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success('Medical record created.');
      setRecordSheet({ open: false, appointment: null });
      loadAppointments();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openWaitlistDialog = (type, entry) => {
    setWaitlistForm({
      startsAt: defaultWaitlistTime(entry),
      reason: '',
    });
    setWaitlistDialog({ open: true, type, entry });
  };

  const closeWaitlistDialog = () => {
    if (submitting) return;
    setWaitlistDialog({ open: false, type: '', entry: null });
    setWaitlistForm({ startsAt: '', reason: '' });
  };

  const submitWaitlistAction = async () => {
    if (waitlistDialog.type === 'accept' && !waitlistForm.startsAt) {
      toast.error('Choose the appointment time.');
      return;
    }
    if (waitlistDialog.type === 'reject' && !waitlistForm.reason.trim()) {
      toast.error('Please add a rejection reason.');
      return;
    }
    setSubmitting(true);
    try {
      if (waitlistDialog.type === 'accept') {
        await api.patch(`/doctor/waitlist/${waitlistDialog.entry._id}/accept`, {
          startsAt: new Date(waitlistForm.startsAt).toISOString(),
        });
        toast.success('Waitlist patient accepted and appointment created.');
      } else {
        await api.patch(`/doctor/waitlist/${waitlistDialog.entry._id}/reject`, {
          reason: waitlistForm.reason,
        });
        toast.success('Waitlist request rejected.');
      }
      setWaitlistDialog({ open: false, type: '', entry: null });
      setWaitlistForm({ startsAt: '', reason: '' });
      loadAppointments();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const currentRecordStep = recordSteps[recordStep];

  return (
    <div className="doctor-page">
      <div className="doctor-page-head">
        <div>
          <h2>Daily Schedule</h2>
          <p>Manage appointment lifecycle transitions and clinical record creation.</p>
        </div>
      </div>

      {error && <p className="page-alert error">{error}</p>}
      {loading && <p className="muted-text">Loading schedule...</p>}
      {!loading && appointments.length === 0 && <div className="doctor-card empty-state">No appointments assigned yet.</div>}

      <div className="doctor-list">
        {appointments.map((slot) => (
          <article key={slot._id} className="doctor-card doctor-schedule-card">
            <p><Clock3 size={16} /> {formatDateTime(slot.startsAt)}</p>
            <p><UserRound size={16} /> {slot.patient?.fullName || 'Patient'}</p>
            <span className={`doc-pill status-${slot.status}`}>{slot.status}</span>
            {slot.source === 'waitlist' && <span className="doc-pill waitlist-source">From waitlist</span>}
            {slot.statusReason && <p className="doctor-card-note">{slot.statusReason}</p>}
            <div className="doctor-patient-actions">
              {slot.status === 'pending' && (
                <>
                  <button className="doc-primary-btn" onClick={() => updateStatus(slot._id, 'confirmed')}>
                    <CheckCircle2 size={15} /> Confirm
                  </button>
                  <button className="doc-danger-btn" onClick={() => setRejectDialog({ open: true, appointmentId: slot._id })}>
                    <XCircle size={15} /> Reject
                  </button>
                </>
              )}
              {slot.status === 'confirmed' && (
                <>
                  <button className="doc-primary-btn" onClick={() => updateStatus(slot._id, 'completed')}>
                    <CheckCircle2 size={15} /> Complete
                  </button>
                  <button className="doc-secondary-btn" onClick={() => updateStatus(slot._id, 'no-show')}>
                    No-show
                  </button>
                </>
              )}
              {slot.status === 'completed' && (
                <button className="doc-secondary-btn" onClick={() => openRecordSheet(slot)}>
                  <FilePlus2 size={15} /> Add Record
                </button>
              )}
              <button className="doc-secondary-btn" onClick={() => navigate(`/doctor/schedule/${slot._id}`)}>
                View Details
              </button>
            </div>
          </article>
        ))}
      </div>

      {!loading && waitlist.length > 0 && (
        <>
          <div className="doctor-page-head">
            <div>
              <h2>Waitlist</h2>
              <p>Patients waiting for an available slot with you.</p>
            </div>
          </div>
          <div className="doctor-list">
            {waitlist.map((entry) => (
              <article key={entry._id} className="doctor-card doctor-schedule-card">
                <p><Clock3 size={16} /> {entry.desiredDate ? formatDateTime(entry.desiredDate) : 'Any date'}</p>
                <p><UserRound size={16} /> {entry.patient?.fullName || 'Patient'}</p>
                <p>{entry.appointmentType}</p>
                <span className={`doc-pill status-${entry.status}`}>{entry.status}</span>
                {entry.reason && <p>{entry.reason}</p>}
                {entry.resolution?.reason && <p className="doctor-card-note">{entry.resolution.reason}</p>}
                {['waiting', 'offered'].includes(entry.status) && (
                  <div className="doctor-patient-actions">
                    <button className="doc-primary-btn" type="button" onClick={() => openWaitlistDialog('accept', entry)}>
                      <CheckCircle2 size={15} /> Accept
                    </button>
                    <button className="doc-danger-btn" type="button" onClick={() => openWaitlistDialog('reject', entry)}>
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        </>
      )}

      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, appointmentId: open ? rejectDialog.appointmentId : '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Appointment Request</DialogTitle>
            <DialogDescription>Add a clear reason. The patient will see this on their appointment timeline.</DialogDescription>
          </DialogHeader>
          <label className="doctor-field">
            <span>Reason</span>
            <textarea
              rows="4"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Briefly explain why this request cannot be accepted"
            />
          </label>
          <DialogFooter>
            <button type="button" className="doc-secondary-btn" onClick={() => setRejectDialog({ open: false, appointmentId: '' })} disabled={submitting}>
              Keep Request
            </button>
            <button type="button" className="doc-danger-btn" onClick={submitRejection} disabled={submitting}>
              {submitting ? 'Saving...' : 'Reject Request'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={recordSheet.open} onOpenChange={(open) => setRecordSheet({ open, appointment: open ? recordSheet.appointment : null })}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create Medical Record</SheetTitle>
            <SheetDescription>Answer each clinical field in order. You can skip optional fields and finish when ready.</SheetDescription>
          </SheetHeader>
          <div className="sheet-form">
            <div className="record-step-head">
              <span className="doc-pill">{recordStep + 1} / {recordSteps.length}</span>
              <strong>{currentRecordStep.label}</strong>
            </div>
            {currentRecordStep.key === 'attachment' ? (
              <label className="doctor-field">
                <span><FileUp size={15} /> PDF attachment</span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setRecordFile(e.target.files?.[0] || null)}
                />
              </label>
            ) : (
              <label className="doctor-field">
                <span><ClipboardPlus size={15} /> {currentRecordStep.label}{currentRecordStep.required ? ' *' : ''}</span>
                {currentRecordStep.rows === 1 ? (
                  <input
                    value={recordForm[currentRecordStep.key]}
                    onKeyDown={handleRecordKeyDown}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, [currentRecordStep.key]: e.target.value }))}
                    placeholder={currentRecordStep.placeholder}
                  />
                ) : (
                  <textarea
                    rows={currentRecordStep.rows}
                    value={recordForm[currentRecordStep.key]}
                    onKeyDown={handleRecordKeyDown}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, [currentRecordStep.key]: e.target.value }))}
                    placeholder={currentRecordStep.placeholder}
                  />
                )}
              </label>
            )}
            <div className="record-step-actions">
              <button className="doc-secondary-btn" type="button" onClick={() => moveRecordStep(-1)} disabled={recordStep === 0 || submitting}>
                Back
              </button>
              <button className="doc-secondary-btn" type="button" onClick={() => moveRecordStep(1)} disabled={recordStep === recordSteps.length - 1 || submitting}>
                <SkipForward size={15} /> Skip / Next
              </button>
            </div>
          </div>
          <SheetFooter>
            <button className="doc-secondary-btn" type="button" onClick={() => setRecordSheet({ open: false, appointment: null })} disabled={submitting}>
              Cancel
            </button>
            <button className="doc-primary-btn" type="button" onClick={createRecord} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Record'}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={waitlistDialog.open} onOpenChange={(open) => !open && closeWaitlistDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{waitlistDialog.type === 'accept' ? 'Accept Waitlist Request' : 'Reject Waitlist Request'}</DialogTitle>
            <DialogDescription>
              {waitlistDialog.type === 'accept'
                ? 'Choose the exact appointment time to create a confirmed booking.'
                : 'Give the patient a clear reason for declining this waitlist request.'}
            </DialogDescription>
          </DialogHeader>
          <div className="dialog-form">
            {waitlistDialog.type === 'accept' ? (
              <label className="doctor-field">
                <span><Clock3 size={15} /> Appointment time</span>
                <input
                  type="datetime-local"
                  value={waitlistForm.startsAt}
                  onChange={(e) => setWaitlistForm((prev) => ({ ...prev, startsAt: e.target.value }))}
                />
              </label>
            ) : (
              <label className="doctor-field">
                <span>Reason</span>
                <textarea
                  rows="4"
                  value={waitlistForm.reason}
                  onChange={(e) => setWaitlistForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Why can this request not be accepted?"
                />
              </label>
            )}
          </div>
          <DialogFooter>
            <button type="button" className="doc-secondary-btn" onClick={closeWaitlistDialog} disabled={submitting}>
              Cancel
            </button>
            <button
              type="button"
              className={waitlistDialog.type === 'accept' ? 'doc-primary-btn' : 'doc-danger-btn'}
              onClick={submitWaitlistAction}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : waitlistDialog.type === 'accept' ? 'Accept' : 'Reject'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorSchedule;
