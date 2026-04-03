import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../client-growth-system-v3'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
