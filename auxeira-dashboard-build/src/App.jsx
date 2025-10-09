import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import FerrariVCDashboard from './dashboards/FerrariVCDashboard';
import FerrariAngelInvestorDashboard from './dashboards/FerrariAngelInvestorDashboard';
import FerrariESGEducationDashboard from './dashboards/FerrariESGEducationDashboard';
import FerrariGovernmentAgencyDashboard from './dashboards/FerrariGovernmentAgencyDashboard';
import FerrariESGInvestorDashboard from './dashboards/FerrariESGInvestorDashboard';

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '64px' }}>🚀</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>Auxeira</div>
        <div style={{ fontSize: '14px' }}>Loading Dashboard...</div>
      </div>
    </div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setLoading(false), 500); }, []);
  if (loading) return <LoadingScreen />;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/venture_capital" replace />} />
        <Route path="/dashboard/venture_capital" element={<FerrariVCDashboard />} />
        <Route path="/dashboard/angel_investor" element={<FerrariAngelInvestorDashboard />} />
        <Route path="/dashboard/esg_education" element={<FerrariESGEducationDashboard />} />
        <Route path="/dashboard/government" element={<FerrariGovernmentAgencyDashboard />} />
        <Route path="/dashboard/esg_investor" element={<FerrariESGInvestorDashboard />} />
        <Route path="*" element={<Navigate to="/dashboard/venture_capital" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
