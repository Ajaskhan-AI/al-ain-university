import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui/ToastProvider.tsx'
import { AppProvider } from './store/AppProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AppProvider>
  </StrictMode>,
)
