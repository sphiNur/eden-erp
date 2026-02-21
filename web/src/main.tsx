import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize official Telegram SDK if available (non-blocking)
import('@telegram-apps/sdk-react').then(({ init, viewport }) => {
    try {
        init();
        if (viewport.mount.isAvailable()) {
            viewport.mount().then(() => {
                if (viewport.bindCssVars.isAvailable()) {
                    viewport.bindCssVars();
                }
            }).catch(err => {
                console.warn('Failed to mount viewport:', err);
            });
        }
    } catch (e) {
        console.warn('Telegram SDK init failed:', e);
    }
}).catch(() => {
    console.warn('Telegram SDK not available (not in TMA environment)');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
