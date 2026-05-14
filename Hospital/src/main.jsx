// main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// The paths must match your folder structure exactly
import './index.css'
import './App.css'
import './styles/Dashboard.css' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)