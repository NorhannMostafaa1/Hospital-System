import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import "../../styles/authup.css";

const AuthUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/patient/signup', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      saveSession(data.data);
      localStorage.setItem('isLoggedIn', 'true');
      navigate('/patient/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-side-panel">
        <div className="side-content">
          <h1>Your Health, <br />Our Priority.</h1>
          <p>Sign up today to manage your appointments, view medical records, and consult with top specialists from Alexandria.</p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="form-card">
          <div className="auth-role-switch">
            <Link to="/signup" className="auth-role-chip active">Patient</Link>
            <Link to="/doctor/signup" className="auth-role-chip">Doctor</Link>
          </div>
          <header className="form-header">
            <h2>Get Started</h2>
            <p>Already have an account? <Link to="/login">Sign In</Link></p>
          </header>

          <form onSubmit={handleSignup} className="signup-form">
            {error && <p className="form-error">{error}</p>}
            <div className="input-field">
              <label>Full Name</label>
              <div className="input-icon-wrapper">
                <User size={18} className="input-icon" />
                <input 
                  name="fullName"
                  type="text" 
                  placeholder="Enter your full name" 
                  required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-field">
              <label>Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-field">
              <label>Phone Number</label>
              <div className="input-icon-wrapper">
                <Phone size={18} className="input-icon" />
                <input 
                  name="phone"
                  type="tel" 
                  placeholder="01xxxxxxxxx" 
                  required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="dual-input">
              <div className="input-field">
                <label>Password</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    name="password"
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="input-field">
                <label>Confirm</label>
                <div className="input-icon-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input 
                    name="confirmPassword"
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthUp;
