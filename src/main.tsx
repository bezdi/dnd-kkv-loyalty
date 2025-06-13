import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ProtectedApp from './wrappers/ProtectedApp.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ProtectedApp>
            <App />
        </ProtectedApp>
    </StrictMode>,


)
