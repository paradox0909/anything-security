import React, { useState, useEffect } from 'react';
import {
  getPhishingTemplates,
  createPhishingTemplate,
  updatePhishingTemplate,
  deletePhishingTemplate,
  getPhishingCampaigns,
  createPhishingCampaign,
  getCampaignStats
} from '../services/api';

function PhishingTraining() {
  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
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
    recipient_emails: ''
  });

  useEffect(() => {
    loadTemplates();
    loadCampaigns();
  }, []);

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
      setCampaignData({ name: '', template_id: '', recipient_emails: '' });
      loadCampaigns();
      alert('캠페인이 생성되었습니다. 이메일이 발송됩니다.');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      alert('캠페인 생성에 실패했습니다.');
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
              />
            </div>
            <div className="form-group">
              <label>발신자 이름</label>
              <input
                type="text"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
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
              <label>본문 (HTML 지원)</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
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
          <h2>새 캠페인</h2>
          <form onSubmit={handleCampaignSubmit}>
            <div className="form-group">
              <label>캠페인 이름</label>
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
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.subject}</td>
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
        <h2>캠페인 목록</h2>
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>상태</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => (
              <tr key={campaign.id}>
                <td>{campaign.name}</td>
                <td>{campaign.status}</td>
                <td>{new Date(campaign.created_at).toLocaleDateString('ko-KR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PhishingTraining;

