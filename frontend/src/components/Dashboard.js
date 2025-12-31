import React, { useState, useEffect } from 'react';
import { getPhishingCampaigns, getAssets, getCVEAlerts } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    campaigns: 0,
    assets: 0,
    cveAlerts: 0,
    activeAssets: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [campaignsRes, assetsRes, alertsRes] = await Promise.all([
        getPhishingCampaigns(),
        getAssets(),
        getCVEAlerts({ limit: 1 })
      ]);

      const activeAssets = assetsRes.data.filter(a => a.is_active).length;

      setStats({
        campaigns: campaignsRes.data.length,
        assets: assetsRes.data.length,
        activeAssets: activeAssets,
        cveAlerts: alertsRes.data.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  return (
    <div className="dashboard">
      <h1>대시보드</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>피싱 캠페인</h3>
          <div className="stat-value">{stats.campaigns}</div>
        </div>
        <div className="stat-card">
          <h3>전체 자산</h3>
          <div className="stat-value">{stats.assets}</div>
        </div>
        <div className="stat-card">
          <h3>활성 자산</h3>
          <div className="stat-value">{stats.activeAssets}</div>
        </div>
        <div className="stat-card">
          <h3>CVE 알림</h3>
          <div className="stat-value">{stats.cveAlerts}</div>
        </div>
      </div>

      <div className="card">
        <h2>빠른 시작</h2>
        <p>좌측 메뉴를 통해 다음 기능을 사용할 수 있습니다:</p>
        <ul>
          <li><strong>피싱 훈련:</strong> 피싱 메일 템플릿을 만들고 캠페인을 실행하여 직원들의 보안 인식을 향상시킵니다.</li>
          <li><strong>자산 관리:</strong> 조직의 IT 자산을 등록하고 관리합니다.</li>
          <li><strong>CVE 모니터링:</strong> 등록된 자산에 대한 CVE를 자동으로 모니터링하고 Slack으로 알림을 받습니다.</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;

