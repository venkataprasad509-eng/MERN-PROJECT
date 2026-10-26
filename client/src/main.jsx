import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Global error handler to catch crashes before React renders
window.addEventListener('error', (event) => {
  console.error('GLOBAL ERROR:', event.error);
  document.getElementById('root').innerHTML = `
    <div style="padding:40px;font-family:Inter,sans-serif;text-align:center;">
      <h1 style="color:#ef4444;font-size:1.5rem;">Runtime Error</h1>
      <pre style="background:#fef2f2;padding:20px;border-radius:8px;text-align:left;max-width:700px;margin:20px auto;overflow:auto;font-size:12px;color:#991b1b;">${event.error?.stack || event.error?.message || event.message}</pre>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('UNHANDLED PROMISE:', event.reason);
});

try {
  const root = createRoot(document.getElementById('root'));
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (e) {
  console.error('RENDER CRASH:', e);
  document.getElementById('root').innerHTML = `
    <div style="padding:40px;font-family:sans-serif;">
      <h1 style="color:red;">App failed to mount</h1>
      <pre style="background:#fee;padding:20px;">${e.stack}</pre>
    </div>
  `;
}
