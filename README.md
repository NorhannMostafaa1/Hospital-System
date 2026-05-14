# Hospital Management System

## Overview

The Hospital Management System is a full-stack web application designed to simplify hospital operations and improve communication between doctors and patients. The system provides authentication, appointment management, patient records handling, scheduling features, and dashboard interfaces for different user roles.

This project was developed as a web development project using modern frontend and backend technologies.

---

# Features

## Authentication System

* Login and signup functionality
* Separate authentication for doctors and patients
* Role-based access control
* Secure user session handling

## Patient Features

* Book appointments
* View appointment details
* Manage personal profile
* Access prescriptions and records
* Track appointment history
* Patient dashboard interface

## Doctor Features

* Manage schedules
* View patient records
* Access patient details
* Manage appointments
* Doctor dashboard interface
* Consultant profile management

## Notification System

* Notification center component
* Appointment and schedule updates
* User interaction alerts

## Responsive Design

* Responsive user interface
* Optimized layouts for different screen sizes
* Clean and modern UI design

---

# Technologies Used

## Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Tailwind CSS
* Vite

## Backend

* Node.js
* Express.js

## Database

* MongoDB

## Additional Tools

* REST API integration
* Role-based routing
* Component-based architecture
* Modular project structure

---

# Project Structure

```bash
Hospital/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── Layouts/
│   ├── modules/
│   │   ├── doctor/
│   │   ├── patient/
│   │   ├── common/
│   │   └── routes/
│   ├── services/
│   ├── styles/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
├── package.json
└── vite.config.js
```

---

# Main Modules

## Doctor Module

The doctor module contains all features related to doctors and consultants.

### Included Features

* Doctor authentication
* Dashboard management
* Patient records management
* Schedule handling
* Settings management
* Consultant profile pages

### Important Files

* `Dashboard.jsx`
* `Patients.jsx`
* `PatientRecords.jsx`
* `schedule.jsx`
* `ConsultantProfile.jsx`

---

## Patient Module

The patient module handles all patient-related operations.

### Included Features

* Patient authentication
* Appointment booking
* Profile management
* Prescription viewing
* Appointment tracking

### Important Files

* `AppointmentBooking.jsx`
* `MyAppointments.jsx`
* `Prescription.jsx`
* `Profile.jsx`
* `Dashboard.jsx`

---

## Routing System

The project uses a centralized routing structure.

### Route Management

* Application routes are managed inside:

```bash
src/modules/routes/AppRoutes.jsx
```

This allows easy navigation and role-based page rendering.

---

# Backend Overview

The backend handles:

* Authentication
* API requests
* Database operations
* User management
* Appointment management
* Data validation

The backend uses Express.js with MongoDB for storing application data.

---

# Installation Guide

## Prerequisites

Before running the project, make sure the following are installed:

* Node.js
* npm
* MongoDB

---

# Running the Frontend

Navigate to the frontend folder:

```bash
cd Hospital
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

# Running the Backend

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Run the backend server:

```bash
npm start
```

---

# Environment Variables

The backend uses environment variables stored in a `.env` file.

Example:

```env
MONGO_URI=your_mongodb_connection
PORT=5000
JWT_SECRET=your_secret_key
```

---

# API Integration

The frontend communicates with the backend using API service functions.

Main API configuration:

```bash
src/services/api.js
```

---

# Design Architecture

The project follows a modular architecture:

* Reusable React components
* Separate layouts for doctors and patients
* Organized service layer
* Centralized routing
* Scalable folder structure

---

# Security Features

* Authentication system
* Role-based authorization
* Protected routes
* Secure login/signup handling
* User-specific dashboards

---

# Future Improvements

Possible future enhancements include:

* Real-time chat between doctors and patients
* Online video consultation
* Payment gateway integration
* Medical report uploads
* AI-powered appointment recommendations
* Email and SMS notifications
* Admin dashboard

---

# Learning Outcomes

Through this project, the following concepts were applied:

* Full-stack web development
* React component architecture
* REST API integration
* MongoDB database management
* Authentication systems
* Role-based access control
* Responsive web design
* Software project structuring

---

# Author

Norhan Mostafa

Computer Science Student | AI & Full-Stack Development Enthusiast
