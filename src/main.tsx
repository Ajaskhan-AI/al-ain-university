import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary, reloadOnceForNewVersion } from './components/ErrorBoundary.tsx'
import { ToastProvider } from './components/ui/ToastProvider.tsx'
import { SimulatorProvider } from './sim/SimulatorProvider.tsx'
import { AppProvider } from './store/AppProvider.tsx'

// After a new deployment, old page files no longer exist on the server.
// Vite fires this event when loading one fails: reload once to get the new version.
window.addEventListener('vite:preloadError', (event) => {
  if (reloadOnceForNewVersion()) event.preventDefault()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <ToastProvider>
          <SimulatorProvider>
            <App />
          </SimulatorProvider>
        </ToastProvider>
      </AppProvider>
    </ErrorBoundary>
  </StrictMode>,
)
