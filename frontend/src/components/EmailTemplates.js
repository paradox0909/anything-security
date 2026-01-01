import React, { useState, useEffect } from 'react';
import {
  getPhishingTemplates,
  createPhishingTemplate,
  updatePhishingTemplate,
  deletePhishingTemplate
} from '../services/api';

function EmailTemplates() {
  const [templates, setTemplates] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    sender_email: '',
    sender_name: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await getPhishingTemplates();
      setTemplates(res.data);
    } catch (error) {
      console.error('Failed to load templates:', error);
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
        <div>
          <h1>이메일 템플릿</h1>
          <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>피싱 메일 템플릿을 생성하고 관리하세요</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowTemplateForm(true); setEditingTemplate(null); setFormData({ name: '', subject: '', body: '', sender_email: '', sender_name: '' }); }}>
          템플릿 추가
        </button>
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
              <div style={{ 
                padding: '1rem', 
                background: '#f8f9fa', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                color: '#666'
              }}>
                <strong>환경 변수에서 관리됩니다</strong>
                <br />
                <small>발신자 이메일은 .env 파일의 SMTP_FROM_EMAIL로 설정됩니다.</small>
                <div style={{ marginTop: '0.5rem', color: '#2c3e50' }}>
                  현재 설정: <strong>{formData.sender_email || 'env에서 관리'}</strong>
                </div>
              </div>
              <input
                type="hidden"
                value={formData.sender_email || ''}
                name="sender_email"
              />
            </div>
            <div className="form-group">
              <label>발신자 이름</label>
              <input
                type="text"
                value={formData.sender_name}
                onChange={(e) => setFormData({ ...formData, sender_name: e.target.value })}
                placeholder="예: 보안팀 (선택사항)"
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
              <label>본문 (HTML 소스 그대로)</label>
              <small style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                여기는 <strong>HTML을 그대로</strong> 붙여넣는 칸입니다. ReactQuill(WYSIWYG)처럼 <code>&lt;html&gt;</code>을 텍스트로 이스케이프하지 않습니다.
                <br />
                템플릿 변수: {'{{ name }}'}, {'{{ email }}'}, {'{{ click_url }}'}, {'{{ report_url }}'}
              </small>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder={'<div style=\"font-family: Arial;\">Hello {{ name }}</div>'}
                required
                rows={14}
                style={{ width: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace' }}
              />
            </div>
            <button type="submit" className="btn btn-primary">저장</button>
            <button type="button" className="btn" onClick={() => { setShowTemplateForm(false); setEditingTemplate(null); }} style={{ marginLeft: '1rem' }}>
              취소
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>템플릿 목록</h2>
        {templates.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
            아직 생성된 템플릿이 없습니다. 새 템플릿을 생성해보세요.
          </p>
        ) : (
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
        )}
      </div>
    </div>
  );
}

export default EmailTemplates;

