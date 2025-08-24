import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

// Import the EXACT same components used by both platforms
import DataPage from './routes/dashboard/data/index'
import DatabasePage from './routes/dashboard/database/index'
import DashboardPage from './routes/dashboard/index'
import IndexPage from './routes/index'

// Import theme provider and styles
import { ThemeProvider } from './components/theme-provider'
import './styles/globals.css'

// Platform detection and conditional polyfill loading
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined

// Load polyfills conditionally for web platform
if (!isTauri && typeof window !== 'undefined') {
  import('./lib/polyfill-init')
}

// Unified app component that works for both platforms
function UnifiedApp() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/database" element={<DatabasePage />} />
          <Route path="/dashboard/data" element={<DataPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

// Mount the app
const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(<UnifiedApp />)
} else {
  console.error('Root container not found')
}