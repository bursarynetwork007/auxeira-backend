import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Import the dashboard component
import FerrariVCDashboard from '../../frontend/dashboard/components/FerrariVCDashboard.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FerrariVCDashboard />
  </React.StrictMode>
);
