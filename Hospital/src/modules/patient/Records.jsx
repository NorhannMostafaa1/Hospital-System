import React, { useEffect, useState } from 'react';
import { Download, Eye, FileText, ShieldCheck } from 'lucide-react';
import { api, formatDateTime } from '../../services/api';
import '../../styles/PatientPages.css';

const PatientRecords = () => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/patient/records');
        setRecords(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openAttachment = async (record, attachment, mode) => {
    try {
      const { data } = await api.get(`/records/${record._id}/attachments/${attachment._id}/download`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(data);
      if (mode === 'view') {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || 'medical-record-attachment';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="patient-page">
      <div className="patient-page-head">
        <div>
          <h2>Medical Records</h2>
          <p>Records are created only after completed appointments.</p>
        </div>
      </div>

      {error && <p className="page-alert error">{error}</p>}
      {loading && <p className="muted-text">Loading records...</p>}
      {!loading && records.length === 0 && <div className="page-card empty-state">No medical records yet.</div>}

      <div className="records-list">
        {records.map((record) => (
          <article key={record._id} className="page-card record-card">
            <div className="record-left">
              <FileText size={20} />
              <div>
                <h3>{record.diagnosis}</h3>
                <p>{formatDateTime(record.createdAt)}</p>
                {record.symptoms?.length > 0 && <p><strong>Symptoms:</strong> {record.symptoms.join(', ')}</p>}
                {record.medications?.length > 0 && <p><strong>Medications:</strong> {record.medications.join(', ')}</p>}
                {record.prescriptions?.length > 0 && (
                  <p><strong>Prescriptions:</strong> {record.prescriptions.map((item) => item.medicineName).join(', ')}</p>
                )}
                {record.labResults?.length > 0 && <p><strong>Lab results:</strong> {record.labResults.join(', ')}</p>}
                <p className="muted-text">{record.notes || 'No notes provided'}</p>
                {record.attachments?.length > 0 && (
                  <div className="attachment-list">
                    {record.attachments.map((attachment) => (
                      <div key={attachment._id} className="attachment-row">
                        <span>{attachment.originalName || 'Attachment'}</span>
                        <button className="page-secondary-btn" type="button" onClick={() => openAttachment(record, attachment, 'view')}>
                          <Eye size={15} /> View
                        </button>
                        <button className="page-secondary-btn" type="button" onClick={() => openAttachment(record, attachment, 'download')}>
                          <Download size={15} /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="record-right">
              <span className="pill">{record.locked ? 'Locked' : 'Draft'}</span>
              <span className="pill">{record.amendments?.length || 0} amendments</span>
            </div>
          </article>
        ))}
      </div>

      <div className="page-card privacy-note">
        <ShieldCheck size={20} />
        <p>Your records are protected by role-based access and amendment history.</p>
      </div>
    </div>
  );
};

export default PatientRecords;
