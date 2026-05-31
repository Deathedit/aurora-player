import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

const saved = localStorage.getItem('aurora-theme')
if (saved === '"light"') {
  document.documentElement.classList.remove('dark')
  document.documentElement.classList.add('light')
} else {
  document.documentElement.classList.add('dark')
  document.documentElement.classList.remove('light')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)