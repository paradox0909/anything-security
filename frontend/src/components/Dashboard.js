import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPhishingCampaigns, getCampaignStats, getAssets, getCVEAlerts, getPhishingTemplates } from '../services/api';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalRecipients: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalReported: 0,
    totalAssets: 0,
    activeAssets: 0,
    totalCVEAlerts: 0,
    recentCampaigns: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [campaignsRes, assetsRes, alertsRes, templatesRes] = await Promise.all([
        getPhishingCampaigns(),
        getAssets(),
        getCVEAlerts({ limit: 10 }),
        getPhishingTemplates()
      ]);

      const campaigns = Array.isArray(campaignsRes.data) ? campaignsRes.data : [];
      const activeCampaigns = campaigns.filter(c => c.status === 'sent' || c.status === 'scheduled');
      
      // 최근 캠페인들의 통계 집계
      let totalRecipients = 0;
      let totalOpened = 0;
      let totalClicked = 0;
      let totalReported = 0;

      const recentCampaigns = campaigns.slice(0, 5);
      
      for (const campaign of recentCampaigns) {
        try {
          const statsRes = await getCampaignStats(campaign.id);
          const stats = statsRes.data || {};
          totalRecipients += stats.total_recipients || 0;
          totalOpened += stats.opened || 0;
          totalClicked += stats.clicked || 0;
          totalReported += stats.reported || 0;
        } catch (e) {
          console.error(`Failed to load stats for campaign ${campaign.id}:`, e);
        }
      }

      const assets = Array.isArray(assetsRes.data) ? assetsRes.data : [];
      const alerts = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      const templates = Array.isArray(templatesRes.data) ? templatesRes.data : [];
      
      const activeAssets = assets.filter(a => a.is_active).length;

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: activeCampaigns.length,
        totalRecipients,
        totalOpened,
        totalClicked,
        totalReported,
        totalAssets: assets.length,
        activeAssets,
        totalCVEAlerts: alerts.length,
        recentCampaigns: recentCampaigns,
        totalTemplates: templates.length
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">로딩 중...</div>
      </div>
    );
  }

  const openRate = stats.totalRecipients > 0 ? ((stats.totalOpened / stats.totalRecipients) * 100).toFixed(1) : 0;
  const clickRate = stats.totalRecipients > 0 ? ((stats.totalClicked / stats.totalRecipients) * 100).toFixed(1) : 0;
  const reportRate = stats.totalRecipients > 0 ? ((stats.totalReported / stats.totalRecipients) * 100).toFixed(1) : 0;

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>대시보드</h1>
        <p>전체 보안 플랫폼 현황을 한눈에 확인하세요</p>
      </div>

      {/* 피싱 훈련 통계 */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>📧 피싱 훈련 현황</h2>
          <Link to="/campaigns" className="btn btn-primary">캠페인 관리</Link>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>전체 캠페인</h3>
              <div className="stat-value">{stats.totalCampaigns}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚀</div>
            <div className="stat-content">
              <h3>활성 캠페인</h3>
              <div className="stat-value">{stats.activeCampaigns}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>전체 수신자</h3>
              <div className="stat-value">{stats.totalRecipients}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📬</div>
            <div className="stat-content">
              <h3>메일 오픈율</h3>
              <div className="stat-value">{openRate}%</div>
              <div className="stat-detail">{stats.totalOpened} / {stats.totalRecipients}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🖱️</div>
            <div className="stat-content">
              <h3>링크 클릭율</h3>
              <div className="stat-value">{clickRate}%</div>
              <div className="stat-detail">{stats.totalClicked} / {stats.totalRecipients}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h3>피싱 신고율</h3>
              <div className="stat-value">{reportRate}%</div>
              <div className="stat-detail">{stats.totalReported} / {stats.totalRecipients}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 자산 및 CVE 통계 */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>💻 자산 및 보안 현황</h2>
          <div>
            <Link to="/assets" className="btn" style={{ marginRight: '0.5rem' }}>자산 관리</Link>
            <Link to="/cve" className="btn btn-primary">CVE 모니터링</Link>
          </div>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💻</div>
            <div className="stat-content">
              <h3>전체 자산</h3>
              <div className="stat-value">{stats.totalAssets}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>활성 자산</h3>
              <div className="stat-value">{stats.activeAssets}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-content">
              <h3>CVE 알림</h3>
              <div className="stat-value">{stats.totalCVEAlerts}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 캠페인 */}
      {stats.recentCampaigns.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>📋 최근 캠페인</h2>
            <Link to="/campaigns" className="btn">전체 보기</Link>
          </div>
          <div className="card">
            <table className="table">
              <thead>
                <tr>
                  <th>캠페인 이름</th>
                  <th>상태</th>
                  <th>생성일</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCampaigns.map(campaign => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>
                      <span className={`badge ${
                        campaign.status === 'closed' ? 'badge-low' : 
                        campaign.status === 'sent' ? 'badge-high' : 
                        campaign.status === 'scheduled' ? 'badge-medium' : ''
                      }`}>
                        {campaign.status === 'draft' ? '초안' : 
                         campaign.status === 'scheduled' ? '예약됨' :
                         campaign.status === 'sent' ? '발송됨' :
                         campaign.status === 'completed' ? '완료' :
                         campaign.status === 'closed' ? '종료됨' : campaign.status}
                      </span>
                    </td>
                    <td>{new Date(campaign.created_at).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <Link to={`/campaigns?campaign=${campaign.id}`} className="btn btn-primary">상세보기</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 빠른 작업 */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>⚡ 빠른 작업</h2>
        </div>
        <div className="quick-actions">
          <Link to="/campaigns?new=true" className="quick-action-card">
            <div className="quick-action-icon">➕</div>
            <h3>새 캠페인 생성</h3>
            <p>피싱 훈련 캠페인을 시작하세요</p>
          </Link>
          <Link to="/email-templates" className="quick-action-card">
            <div className="quick-action-icon">✉️</div>
            <h3>이메일 템플릿 생성</h3>
            <p>새로운 피싱 메일 템플릿을 만드세요</p>
          </Link>
          <Link to="/assets" className="quick-action-card">
            <div className="quick-action-icon">💻</div>
            <h3>자산 등록</h3>
            <p>새로운 IT 자산을 등록하세요</p>
          </Link>
          <Link to="/landing-pages" className="quick-action-card">
            <div className="quick-action-icon">🌐</div>
            <h3>랜딩 페이지 생성</h3>
            <p>피싱 랜딩 페이지를 만드세요</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
