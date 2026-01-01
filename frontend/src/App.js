import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Campaigns from './components/Campaigns';
import UsersGroups from './components/UsersGroups';
import EmailTemplates from './components/EmailTemplates';
import LandingPages from './components/LandingPages';
import SendingProfiles from './components/SendingProfiles';
import AssetManagement from './components/AssetManagement';
import CVEMonitoring from './components/CVEMonitoring';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Router>
      <div className="App">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/users" element={<UsersGroups />} />
            <Route path="/email-templates" element={<EmailTemplates />} />
            <Route path="/landing-pages" element={<LandingPages />} />
            <Route path="/sending-profiles" element={<SendingProfiles />} />
            <Route path="/assets" element={<AssetManagement />} />
            <Route path="/cve" element={<CVEMonitoring />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
