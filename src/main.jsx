import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import innovalausLogo from './assets/innovalaus-logo.png';
import './style.css';

const favicon = document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/png';
favicon.href = innovalausLogo;
document.head.appendChild(favicon);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
