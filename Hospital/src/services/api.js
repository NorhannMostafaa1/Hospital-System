import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getRouteRole = () => {
  if (window.location.pathname.startsWith('/doctor')) return 'doctor';
  if (window.location.pathname.startsWith('/patient')) return 'patient';
  return localStorage.getItem('activeRole');
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const role = getRouteRole();
  const roleToken = role ? localStorage.getItem(`${role}AuthToken`) : null;
  const legacyToken = localStorage.getItem('activeRole') === role ? localStorage.getItem('authToken') : null;
  const token = roleToken || legacyToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

export const saveSession = ({ token, user }) => {
  localStorage.setItem(`${user.role}AuthToken`, token);
  localStorage.setItem(`${user.role}User`, JSON.stringify(user));
  localStorage.setItem('authToken', token);
  localStorage.setItem('activeUser', JSON.stringify(user));
  localStorage.setItem('activeRole', user.role);
};

export const clearSession = (role = localStorage.getItem('activeRole')) => {
  if (role) {
    localStorage.removeItem(`${role}AuthToken`);
    localStorage.removeItem(`${role}User`);
  }
  localStorage.removeItem('authToken');
  localStorage.removeItem('activeUser');
  localStorage.removeItem('activeRole');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('isDoctorLoggedIn');
};

export const getCurrentUser = () => {
  try {
    const role = getRouteRole();
    const roleUser = role ? localStorage.getItem(`${role}User`) : null;
    const legacyUser = localStorage.getItem('activeRole') === role ? localStorage.getItem('activeUser') : null;
    return JSON.parse(roleUser || legacyUser) || null;
  } catch (_err) {
    return null;
  }
};

export const formatDateTime = (value) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export const formatDateInput = (date = new Date()) => date.toISOString().slice(0, 10);
