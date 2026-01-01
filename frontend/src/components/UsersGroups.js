import React from 'react';

function UsersGroups() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1>사용자 및 그룹</h1>
        <p style={{ color: '#7f8c8d', marginTop: '0.5rem' }}>피싱 훈련 대상 사용자와 그룹을 관리하세요</p>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2>사용자 그룹</h2>
          <button className="btn btn-primary">그룹 추가</button>
        </div>
        <p style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
          사용자 및 그룹 관리 기능은 곧 추가될 예정입니다.
        </p>
      </div>
    </div>
  );
}

export default UsersGroups;

