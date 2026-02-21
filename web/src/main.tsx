import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { init, viewport } from '@telegram-apps/sdk-react'

// Initialize Telegram SDK
init();

// Mount viewport and bind CSS variables for safe area support
if (viewport.mount.isAvailable()) {
    viewport.mount().then(() => {
        if (viewport.bindCssVars.isAvailable()) {
            viewport.bindCssVars();
        }
    }).catch(err => {
        console.error('Failed to mount viewport:', err);
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
