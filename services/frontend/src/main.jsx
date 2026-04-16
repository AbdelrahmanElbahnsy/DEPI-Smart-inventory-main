import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n/index.js';
import App from './App.jsx';
import './styles/index.css';
import './styles/layout.css';
import './styles/dashboard.css';
import './styles/components.css';
import './styles/tables.css';
import './styles/auth.css';
import './styles/pages.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
