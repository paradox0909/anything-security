import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: '📊', label: '대시보드' },
    { path: '/campaigns', icon: '📧', label: '캠페인' },
    { path: '/users', icon: '👥', label: '사용자 및 그룹' },
    { path: '/email-templates', icon: '✉️', label: '이메일 템플릿' },
    { path: '/landing-pages', icon: '🌐', label: '랜딩 페이지' },
    { path: '/sending-profiles', icon: '⚙️', label: '발송 프로필' },
    { path: '/assets', icon: '💻', label: '자산 관리' },
    { path: '/cve', icon: '🔒', label: 'CVE 모니터링' },
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>🛡️ Anything Security</h2>
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            {isOpen ? '←' : '→'}
          </button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      toggleSidebar();
                    }
                  }}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {isOpen && <span className="menu-label">{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;

