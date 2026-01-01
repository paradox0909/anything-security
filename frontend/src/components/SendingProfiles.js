import React from 'react';

function SendingProfiles() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>발송 프로필</h1>
        <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>이메일 발송에 사용할 SMTP 프로필을 관리하세요</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>발송 프로필 목록</h2>
          <button className="btn btn-primary">프로필 추가</button>
        </div>
        <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          발송 프로필 관리 기능은 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

export default SendingProfiles;

