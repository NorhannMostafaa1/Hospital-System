import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRound, Mail, Phone, Lock, Stethoscope, ArrowRight } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import '../../styles/doctorAuth.css';

const specializations = [
  'Cardiology',
  'Neurology',
  'Orthopedics',
  'Dermatology',
  'General Medicine',
  'Pediatrics',
  'Other',
];

const DoctorAuthUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialization: '',
    customSpecialization: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!formData.specialization) {
      setError('Please choose a specialization.');
      return;
    }

    const specializationValue =
      formData.specialization === 'Other'
        ? formData.customSpecialization.trim()
        : formData.specialization;

    if (!specializationValue) {
      setError('Please write your specialization.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/doctor/signup', {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        doctorProfile: {
          specialization: specializationValue,
          department: specializationValue,
        },
      });
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
          <h1>Doctor Portal</h1>
          <p>Create your account to manage your schedule, patients, and consultation records.</p>
        </div>
      </div>

      <div className="doctor-auth-form-wrap">
        <div className="doctor-auth-card">
          <div className="doctor-role-switch">
            <Link to="/doctor/signup" className="doctor-role-chip active">Doctor</Link>
            <Link to="/signup" className="doctor-role-chip">Patient</Link>
          </div>
          <header className="doctor-auth-head">
            <h2>Doctor Sign Up</h2>
            <p>Already registered? <Link to="/doctor/login">Sign in</Link></p>
          </header>

          <form className="doctor-auth-form" onSubmit={handleSignup}>
            {error && <p className="form-error">{error}</p>}
            <div className="doctor-input-field">
              <label>Full Name</label>
              <div className="doctor-input-icon-wrap">
                <UserRound size={18} className="doctor-input-icon" />
                <input
                  name="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="doctor-input-field">
              <label>Email Address</label>
              <div className="doctor-input-icon-wrap">
                <Mail size={18} className="doctor-input-icon" />
                <input
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="doctor-input-field">
              <label>Phone Number</label>
              <div className="doctor-input-icon-wrap">
                <Phone size={18} className="doctor-input-icon" />
                <input
                  name="phone"
                  type="tel"
                  placeholder="01xxxxxxxxx"
                  required
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="doctor-input-field">
              <label>Specialization</label>
              <div className="doctor-input-icon-wrap">
                <Stethoscope size={18} className="doctor-input-icon" />
                <select
                  name="specialization"
                  required
                  value={formData.specialization}
                  onChange={handleChange}
                >
                  <option value="">Select specialization</option>
                  {specializations.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.specialization === 'Other' && (
              <div className="doctor-input-field">
                <label>Write Specialization</label>
                <div className="doctor-input-icon-wrap">
                  <Stethoscope size={18} className="doctor-input-icon" />
                  <input
                    name="customSpecialization"
                    type="text"
                    placeholder="e.g. Endocrinology"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            <div className="doctor-auth-grid-two">
              <div className="doctor-input-field">
                <label>Password</label>
                <div className="doctor-input-icon-wrap">
                  <Lock size={18} className="doctor-input-icon" />
                  <input
                    name="password"
                    type="password"
                    placeholder="********"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="doctor-input-field">
                <label>Confirm</label>
                <div className="doctor-input-icon-wrap">
                  <Lock size={18} className="doctor-input-icon" />
                  <input
                    name="confirmPassword"
                    type="password"
                    placeholder="********"
                    required
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <button className="doctor-submit-btn" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Doctor Account'} <ArrowRight size={18} />
            </button>
          </form>

          <p className="doctor-auth-switch">Patient account? <Link to="/signup">Go to patient sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default DoctorAuthUp;
