import React from 'react';

function LandingPages() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>랜딩 페이지</h1>
        <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>피싱 링크 클릭 시 표시될 랜딩 페이지를 관리하세요</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>랜딩 페이지 목록</h2>
          <button className="btn btn-primary">랜딩 페이지 추가</button>
        </div>
        <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          랜딩 페이지 관리 기능은 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

export default LandingPages;

