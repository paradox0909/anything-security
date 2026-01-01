import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  getPhishingCampaigns,
  createPhishingCampaign,
  getCampaignStats,
  getCampaignRecipients,
  closePhishingCampaign,
  getPhishingTemplates
} from '../services/api';

function Campaigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [campaignRecipients, setCampaignRecipients] = useState([]);
  const [showCampaignForm, setShowCampaignForm] = useState(searchParams.get('new') === 'true');
  const [campaignData, setCampaignData] = useState({
    name: '',
    template_id: '',
    recipient_emails: '',
    target_url: 'https://example.com'
  });

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
    // URL 파라미터에서 new=true가 있으면 폼 열기
    if (searchParams.get('new') === 'true') {
      setShowCampaignForm(true);
    }
  }, [searchParams]);

  // campaigns가 로드된 후 URL 파라미터의 campaign ID 확인
  useEffect(() => {
    const campaignId = searchParams.get('campaign');
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === parseInt(campaignId));
      if (campaign && (!selectedCampaign || selectedCampaign.id !== campaign.id)) {
        setSelectedCampaign(campaign);
      }
    }
  }, [campaigns, searchParams]);

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignDetails(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const loadCampaigns = async () => {
    try {
      const res = await getPhishingCampaigns();
      setCampaigns(res.data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const res = await getPhishingTemplates();
      setTemplates(res.data.filter(t => t.is_active));
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadCampaignDetails = async (campaignId) => {
    try {
      const [statsRes, recipientsRes] = await Promise.all([
        getCampaignStats(campaignId),
        getCampaignRecipients(campaignId)
      ]);
      setCampaignStats(statsRes.data);
      setCampaignRecipients(recipientsRes.data);
    } catch (error) {
      console.error('Failed to load campaign details:', error);
    }
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      const emails = campaignData.recipient_emails.split(',').map(e => e.trim()).filter(e => e);
      await createPhishingCampaign({
        name: campaignData.name,
        template_id: parseInt(campaignData.template_id),
        recipient_emails: emails,
        target_url: campaignData.target_url || 'https://example.com'
      });
      setShowCampaignForm(false);
      setCampaignData({ name: '', template_id: '', recipient_emails: '', target_url: 'https://example.com' });
      setSearchParams({}); // URL 파라미터 제거
      loadCampaigns();
      alert('캠페인이 생성되었습니다. 이메일이 발송됩니다.');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('캠페인 생성에 실패했습니다.');
    }
  };

  const handleCloseCampaign = async (campaignId) => {
    if (window.confirm('정말 이 프로젝트를 종료하시겠습니까?')) {
      try {
        await closePhishingCampaign(campaignId);
        loadCampaigns();
        if (selectedCampaign && selectedCampaign.id === campaignId) {
          setSelectedCampaign(null);
          setCampaignStats(null);
          setCampaignRecipients([]);
        }
        alert('프로젝트가 종료되었습니다.');
      } catch (error) {
        console.error('Failed to close campaign:', error);
        alert('프로젝트 종료에 실패했습니다.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1>캠페인 관리</h1>
          <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>피싱 훈련 캠페인을 생성하고 관리하세요</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setShowCampaignForm(true);
          setSearchParams({ new: 'true' });
        }}>
          새 캠페인 생성
        </button>
      </div>

      {showCampaignForm && (
        <div className="card">
          <h2>새 캠페인 생성</h2>
          <form onSubmit={handleCampaignSubmit}>
            <div className="form-group">
              <label>캠페인 이름</label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                required
                placeholder="예: 2024년 1분기 피싱 훈련"
              />
            </div>
            <div className="form-group">
              <label>이메일 템플릿 선택</label>
              <select
                value={campaignData.template_id}
                onChange={(e) => setCampaignData({ ...campaignData, template_id: e.target.value })}
                required
              >
                <option value="">템플릿 선택</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>수신자 이메일 (쉼표로 구분)</label>
              <textarea
                value={campaignData.recipient_emails}
                onChange={(e) => setCampaignData({ ...campaignData, recipient_emails: e.target.value })}
                placeholder="user1@example.com, user2@example.com"
                required
                rows="5"
              />
            </div>
            <div className="form-group">
              <label>클릭 시 이동할 URL (선택사항)</label>
              <input
                type="url"
                value={campaignData.target_url}
                onChange={(e) => setCampaignData({ ...campaignData, target_url: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary">캠페인 생성</button>
            <button type="button" className="btn" onClick={() => {
              setShowCampaignForm(false);
              setSearchParams({});
            }} style={{ marginLeft: '1rem' }}>
              취소
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>캠페인 목록</h2>
        {campaigns.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            아직 생성된 캠페인이 없습니다. 새 캠페인을 생성해보세요.
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>상태</th>
                <th>생성일</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
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
                    <button 
                      className="btn btn-primary" 
                      onClick={() => setSelectedCampaign(campaign)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      상세보기
                    </button>
                    {campaign.status !== 'closed' && (
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleCloseCampaign(campaign.id)}
                      >
                        종료
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCampaign && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>캠페인 상세: {selectedCampaign.name}</h2>
            <button className="btn" onClick={() => { setSelectedCampaign(null); setCampaignStats(null); setCampaignRecipients([]); }}>
              닫기
            </button>
          </div>

          {campaignStats && (
            <div style={{ marginBottom: '2rem' }}>
              <h3>통계</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>전체 수신자</h3>
                  <div className="stat-value">{campaignStats.total_recipients}</div>
                </div>
                <div className="stat-card">
                  <h3>메일 오픈</h3>
                  <div className="stat-value">{campaignStats.opened} ({campaignStats.open_rate?.toFixed(1)}%)</div>
                </div>
                <div className="stat-card">
                  <h3>링크 클릭</h3>
                  <div className="stat-value">{campaignStats.clicked} ({campaignStats.click_rate?.toFixed(1)}%)</div>
                </div>
                <div className="stat-card">
                  <h3>피싱 신고</h3>
                  <div className="stat-value">{campaignStats.reported} ({campaignStats.report_rate?.toFixed(1)}%)</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <h3>수신자별 상세 추적</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>이메일</th>
                  <th>이름</th>
                  <th>오픈</th>
                  <th>클릭</th>
                  <th>신고</th>
                  <th>발송일</th>
                </tr>
              </thead>
              <tbody>
                {campaignRecipients.map(recipient => (
                  <tr key={recipient.id}>
                    <td>{recipient.email}</td>
                    <td>{recipient.name || '-'}</td>
                    <td>
                      {recipient.opened ? (
                        <span className="badge badge-success">✓ {recipient.opened_at ? new Date(recipient.opened_at).toLocaleString('ko-KR') : ''}</span>
                      ) : (
                        <span className="badge">미오픈</span>
                      )}
                    </td>
                    <td>
                      {recipient.clicked ? (
                        <span className="badge badge-high">✓ {recipient.clicked_at ? new Date(recipient.clicked_at).toLocaleString('ko-KR') : ''}</span>
                      ) : (
                        <span className="badge">미클릭</span>
                      )}
                    </td>
                    <td>
                      {recipient.reported ? (
                        <span className="badge badge-critical">✓ {recipient.reported_at ? new Date(recipient.reported_at).toLocaleString('ko-KR') : ''}</span>
                      ) : (
                        <span className="badge">미신고</span>
                      )}
                    </td>
                    <td>{recipient.sent_at ? new Date(recipient.sent_at).toLocaleString('ko-KR') : '미발송'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Campaigns;

