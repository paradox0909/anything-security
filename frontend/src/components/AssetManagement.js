import React, { useState, useEffect } from 'react';
import { getAssets, createAsset, updateAsset, deleteAsset } from '../services/api';

function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    asset_type: '',
    vendor: '',
    product: '',
    version: '',
    description: '',
    location: '',
    owner: '',
    is_active: true
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await getAssets();
      setAssets(res.data);
    } catch (error) {
      console.error('Failed to load assets:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await updateAsset(editingAsset.id, formData);
      } else {
        await createAsset(formData);
      }
      setShowForm(false);
      setEditingAsset(null);
      setFormData({
        name: '',
        asset_type: '',
        vendor: '',
        product: '',
        version: '',
        description: '',
        location: '',
        owner: '',
        is_active: true
      });
      loadAssets();
    } catch (error) {
      console.error('Failed to save asset:', error);
      alert('자산 저장에 실패했습니다.');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      asset_type: asset.asset_type || '',
      vendor: asset.vendor || '',
      product: asset.product || '',
      version: asset.version || '',
      description: asset.description || '',
      location: asset.location || '',
      owner: asset.owner || '',
      is_active: asset.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteAsset(id);
        loadAssets();
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('자산 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>자산 정보 관리</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingAsset(null); setFormData({ name: '', asset_type: '', vendor: '', product: '', version: '', description: '', location: '', owner: '', is_active: true }); }}>
          자산 추가
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>{editingAsset ? '자산 수정' : '새 자산'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>자산 이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>자산 유형</label>
              <select
                value={formData.asset_type}
                onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
              >
                <option value="">선택</option>
                <option value="software">소프트웨어</option>
                <option value="hardware">하드웨어</option>
                <option value="service">서비스</option>
              </select>
            </div>
            <div className="form-group">
              <label>벤더</label>
              <input
                type="text"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                placeholder="예: Microsoft, Apache"
              />
            </div>
            <div className="form-group">
              <label>제품</label>
              <input
                type="text"
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                placeholder="예: Windows, Tomcat"
              />
            </div>
            <div className="form-group">
              <label>버전</label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                placeholder="예: 10.0, 9.0.1"
              />
            </div>
            <div className="form-group">
              <label>설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>위치</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>담당자</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                활성
              </label>
            </div>
            <button type="submit" className="btn btn-primary">저장</button>
            <button type="button" className="btn" onClick={() => { setShowForm(false); setEditingAsset(null); }} style={{ marginLeft: '1rem' }}>
              취소
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>자산 목록</h2>
        <table className="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>유형</th>
              <th>벤더</th>
              <th>제품</th>
              <th>버전</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(asset => (
              <tr key={asset.id}>
                <td>{asset.name}</td>
                <td>{asset.asset_type || '-'}</td>
                <td>{asset.vendor || '-'}</td>
                <td>{asset.product || '-'}</td>
                <td>{asset.version || '-'}</td>
                <td>{asset.is_active ? '활성' : '비활성'}</td>
                <td>
                  <button className="btn btn-primary" onClick={() => handleEdit(asset)} style={{ marginRight: '0.5rem' }}>
                    수정
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(asset.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssetManagement;

