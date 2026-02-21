import ReactDOM from 'react-dom/client';
import React from 'react';
import { Root } from './components/Root.tsx';
import { init } from './init.ts';
import './index.css';

// Mock the environment in case we are outside Telegram.
import './mockEnv.ts';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Configure all application dependencies.
init({
    debug: import.meta.env.DEV,
    // eruda: import.meta.env.DEV && ['ios', 'android'].includes(platform),
}).then(() => {
    root.render(
        <React.StrictMode>
            <Root />
        </React.StrictMode>
    );
}).catch(err => {
    console.error('Failed to initialize app:', err);
    // Simple fallback if init fails completely
    root.render(
        <div style={{ padding: 20, color: 'red' }}>
            <h1>Initialization Failed</h1>
            <pre>{String(err)}</pre>
        </div>
    );
});
