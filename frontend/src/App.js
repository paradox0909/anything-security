import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import PhishingTraining from './components/PhishingTraining';
import AssetManagement from './components/AssetManagement';
import CVEMonitoring from './components/CVEMonitoring';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-logo">🛡️ Anything Security</h1>
            <ul className="nav-menu">
              <li><Link to="/">대시보드</Link></li>
              <li><Link to="/phishing">피싱 훈련</Link></li>
              <li><Link to="/assets">자산 관리</Link></li>
              <li><Link to="/cve">CVE 모니터링</Link></li>
            </ul>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/phishing" element={<PhishingTraining />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route path="/cve" element={<CVEMonitoring />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

