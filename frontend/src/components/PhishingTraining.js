import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  getPhishingTemplates,
  createPhishingTemplate,
  updatePhishingTemplate,
  deletePhishingTemplate,
  getPhishingCampaigns,
  createPhishingCampaign,
  getCampaignStats,
  getCampaignRecipients,
  closePhishingCampaign
} from '../services/api';

function PhishingTraining() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [campaignRecipients, setCampaignRecipients] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    sender_email: '',
    sender_name: ''
  });
  const [campaignData, setCampaignData] = useState({
    name: '',
    template_id: '',
    recipient_emails: '',
    target_url: 'https://example.com'
  });

  useEffect(() => {
    loadTemplates();
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      loadCampaignDetails(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const loadTemplates = async () => {
    try {
      const res = await getPhishingTemplates();
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const res = await getPhishingCampaigns();
      setCampaigns(res.data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
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

  const handleTemplateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updatePhishingTemplate(editingTemplate.id, formData);
      } else {
        await createPhishingTemplate(formData);
      }
      setShowTemplateForm(false);
      setEditingTemplate(null);
      setFormData({ name: '', subject: '', body: '', sender_email: '', sender_name: '' });
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('템플릿 저장에 실패했습니다.');
    }
  };

  const handleCampaignSubmit = async (e) => {
    e.preventDefault();
    try {
      const emails = campaignData.recipient_emails.split(',').map(e => e.trim()).filter(e => e);
      await createPhishingCampaign({
        name: campaignData.name,
        template_id: parseInt(campaignData.template_id),
        recipient_emails: emails
      });
      setShowCampaignForm(false);
      setCampaignData({ name: '', template_id: '', recipient_emails: '', target_url: 'https://example.com' });
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

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body: template.body,
      sender_email: template.sender_email || '',
      sender_name: template.sender_name || ''
    });
    setShowTemplateForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deletePhishingTemplate(id);
        loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('템플릿 삭제에 실패했습니다.');
      }
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>피싱 메일 훈련</h1>
        <div>
          <button className="btn btn-primary" onClick={() => { setShowTemplateForm(true); setEditingTemplate(null); setFormData({ name: '', subject: '', body: '', sender_email: '', sender_name: '' }); }}>
            템플릿 추가
          </button>
          <button className="btn btn-success" onClick={() => setShowCampaignForm(true)} style={{ marginLeft: '1rem' }}>
            캠페인 생성
          </button>
        </div>
      </div>

      {showTemplateForm && (
        <div className="card">
          <h2>{editingTemplate ? '템플릿 수정' : '새 템플릿'}</h2>
          <form onSubmit={handleTemplateSubmit}>
            <div className="form-group">
              <label>템플릿 이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>발신자 이메일</label>
              <input
                type="email"
                value={formData.sender_email}
                onChange={(e) => setFormData({ ...formData, sender_email: e.target.value })}
                placeholder="발신자 이메일을 선택하거나 입력하세요"
              />
            </div>
            <div className="form-group">
              <label>발신자 이름</label>
              <input
                type="text"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                placeholder="예: 보안팀"
              />
            </div>
            <div className="form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>본문 (HTML 에디터)</label>
              <small style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                템플릿 변수 사용: {'{{ name }}'} (수신자 이름), {'{{ email }}'} (수신자 이메일), {'{{ click_url }}'} (클릭 추적 URL), {'{{ report_url }}'} (신고 URL)
              </small>
              <ReactQuill
                theme="snow"
                value={formData.body}
                onChange={(value) => setFormData({ ...formData, body: value })}
                modules={quillModules}
                style={{ backgroundColor: 'white', minHeight: '300px', marginBottom: '3rem' }}
              />
            </div>
            <button type="submit" className="btn btn-primary">저장</button>
            <button type="button" className="btn" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} style={{ marginLeft: '1rem' }}>
              취소
            </button>
          </form>
        </div>
      )}

      {showCampaignForm && (
        <div className="card">
          <h2>새 캠페인 (프로젝트)</h2>
          <form onSubmit={handleCampaignSubmit}>
            <div className="form-group">
              <label>프로젝트 이름</label>
              <input
                type="text"
                value={campaignData.name}
                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>템플릿 선택</label>
              <select
                value={campaignData.template_id}
                onChange={(e) => setCampaignData({ ...campaignData, template_id: e.target.value })}
                required
              >
                <option value="">템플릿 선택</option>
                {templates.filter(t => t.is_active).map(t => (
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
            <button type="button" className="btn" onClick={() => setShowCampaignForm(false)} style={{ marginLeft: '1rem' }}>
              취소
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>템플릿 목록</h2>
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>제목</th>
              <th>발신자</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.subject}</td>
                <td>{template.sender_email || '-'}</td>
                <td>{template.is_active ? '활성' : '비활성'}</td>
                <td>
                  <button className="btn btn-primary" onClick={() => handleEdit(template)} style={{ marginRight: '0.5rem' }}>
                    수정
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(template.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>프로젝트 목록</h2>
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
                  <span className={`badge ${campaign.status === 'closed' ? 'badge-low' : campaign.status === 'sent' ? 'badge-high' : ''}`}>
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
      </div>

      {selectedCampaign && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>프로젝트 상세: {selectedCampaign.name}</h2>
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

export default PhishingTraining;
