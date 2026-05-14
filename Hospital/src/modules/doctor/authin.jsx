import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import '../../styles/doctorAuth.css';

const DoctorAuthIn = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/doctor/login', credentials);
      saveSession(data.data);
      localStorage.setItem('isDoctorLoggedIn', 'true');
      navigate('/doctor/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="doctor-auth-wrapper">
      <div className="doctor-auth-side">
        <div className="doctor-auth-side-content">
          <h1>Welcome, Doctor</h1>
          <p>Sign in to manage consultations, patient files, and daily rounds.</p>
        </div>
      </div>

      <div className="doctor-auth-form-wrap">
        <div className="doctor-auth-card">
          <div className="doctor-role-switch">
            <Link to="/doctor/login" className="doctor-role-chip active">Doctor</Link>
            <Link to="/login" className="doctor-role-chip">Patient</Link>
          </div>
          <header className="doctor-auth-head">
            <h2>Doctor Sign In</h2>
            <p>No account? <Link to="/doctor/signup">Create one</Link></p>
          </header>

          <form className="doctor-auth-form" onSubmit={handleLogin}>
            {error && <p className="form-error">{error}</p>}
            <div className="doctor-input-field">
              <label>Email</label>
              <div className="doctor-input-icon-wrap">
                <Mail size={18} className="doctor-input-icon" />
                <input name="email" type="email" required onChange={handleChange} />
              </div>
            </div>

            <div className="doctor-input-field">
              <label>Password</label>
              <div className="doctor-input-icon-wrap">
                <Lock size={18} className="doctor-input-icon" />
                <input name="password" type="password" required onChange={handleChange} />
              </div>
            </div>

            <button className="doctor-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login to Doctor Portal'} <LogIn size={18} />
            </button>
          </form>

          <p className="doctor-auth-switch">Patient sign in? <Link to="/login">Go to patient login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default DoctorAuthIn;
