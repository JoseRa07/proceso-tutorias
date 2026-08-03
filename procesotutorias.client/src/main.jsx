import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { I18nProvider } from './i18n/I18nProvider.jsx'
import { installAuthFetch } from './auth/authFetch.js'
import AppErrorBoundary from './componentes/AppErrorBoundary.jsx'

installAuthFetch()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AppErrorBoundary>
  </StrictMode>,
)
