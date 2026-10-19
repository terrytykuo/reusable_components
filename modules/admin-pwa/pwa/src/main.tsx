import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './theme.css'
// Start from the example shell; rename it to App.tsx once you make it yours.
import App from './App.example.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
