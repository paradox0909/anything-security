import React, { useState, useEffect } from 'react';
import { getCVEAlerts, scanAssetCVEs, scanAllAssets, getAssets } from '../services/api';

function CVEMonitoring() {
  const [alerts, setAlerts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterAssetId, setFilterAssetId] = useState('');

  useEffect(() => {
    loadAlerts();
    loadAssets();
  }, []);

  const loadAlerts = async () => {
    try {
      const params = {};
      if (filterAssetId) {
        params.asset_id = parseInt(filterAssetId);
      }
      const res = await getCVEAlerts(params);
      setAlerts(res.data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    }
  };

  const loadAssets = async () => {
    try {
      const res = await getAssets({ is_active: true });
      setAssets(res.data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [filterAssetId]);

  const handleScanAsset = async (assetId) => {
    setLoading(true);
    try {
      await scanAssetCVEs(assetId);
      alert('CVE 스캔이 시작되었습니다. 잠시 후 결과를 확인하세요.');
      setTimeout(() => loadAlerts(), 3000);
    } catch (error) {
      console.error('Failed to scan asset:', error);
      alert('CVE 스캔에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanAll = async () => {
    if (!window.confirm('모든 자산에 대한 CVE 스캔을 시작하시겠습니까?')) {
      return;
    }
    setLoading(true);
    try {
      await scanAllAssets();
      alert('모든 자산에 대한 CVE 스캔이 시작되었습니다.');
      setTimeout(() => loadAlerts(), 5000);
    } catch (error) {
      console.error('Failed to scan all assets:', error);
      alert('CVE 스캔에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    if (!severity) return <span className="badge">N/A</span>;
    const severityLower = severity.toLowerCase();
    if (severityLower === 'critical') return <span className="badge badge-critical">CRITICAL</span>;
    if (severityLower === 'high') return <span className="badge badge-high">HIGH</span>;
    if (severityLower === 'medium') return <span className="badge badge-medium">MEDIUM</span>;
    if (severityLower === 'low') return <span className="badge badge-low">LOW</span>;
    return <span className="badge">{severity}</span>;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>CVE 모니터링</h1>
        <button className="btn btn-success" onClick={handleScanAll} disabled={loading}>
          {loading ? '스캔 중...' : '전체 스캔'}
        </button>
      </div>

      <div className="card">
        <h2>자산별 CVE 스캔</h2>
        <div style={{ marginBottom: '1rem' }}>
          <label>자산 필터: </label>
          <select
            value={filterAssetId}
            onChange={(e) => setFilterAssetId(e.target.value)}
            style={{ marginLeft: '1rem', padding: '0.5rem' }}
          >
            <option value="">전체</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.vendor} {asset.product} {asset.version})
              </option>
            ))}
          </select>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>자산</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>
                  <strong>{asset.name}</strong><br />
                  <small>{asset.vendor} {asset.product} {asset.version}</small>
                </td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleScanAsset(asset.id)}
                    disabled={loading || !asset.vendor || !asset.product || !asset.version}
                  >
                    스캔
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>CVE 알림 목록</h2>
        <table className="table">
          <thead>
            <tr>
              <th>CVE ID</th>
              <th>자산</th>
              <th>심각도</th>
              <th>CVSS 점수</th>
              <th>알림 상태</th>
              <th>발생일</th>
            </tr>
          </thead>
          <tbody>
            {alerts.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  알림이 없습니다.
                </td>
              </tr>
            ) : (
              alerts.map(alert => (
                <tr key={alert.id}>
                  <td>
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${alert.cve_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {alert.cve_id}
                    </a>
                  </td>
                  <td>{alert.asset?.name || 'N/A'}</td>
                  <td>{getSeverityBadge(alert.severity)}</td>
                  <td>{alert.cvss_score || 'N/A'}</td>
                  <td>{alert.notified ? '✓ 알림 완료' : '알림 대기'}</td>
                  <td>{alert.published_date ? new Date(alert.published_date).toLocaleDateString('ko-KR') : 'N/A'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CVEMonitoring;

