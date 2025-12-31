import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 피싱 템플릿
export const getPhishingTemplates = () => api.get('/api/phishing/templates');
export const getPhishingTemplate = (id) => api.get(`/api/phishing/templates/${id}`);
export const createPhishingTemplate = (data) => api.post('/api/phishing/templates', data);
export const updatePhishingTemplate = (id, data) => api.put(`/api/phishing/templates/${id}`, data);
export const deletePhishingTemplate = (id) => api.delete(`/api/phishing/templates/${id}`);

// 피싱 캠페인
export const getPhishingCampaigns = () => api.get('/api/phishing/campaigns');
export const getPhishingCampaign = (id) => api.get(`/api/phishing/campaigns/${id}`);
export const createPhishingCampaign = (data) => api.post('/api/phishing/campaigns', data);
export const getCampaignRecipients = (id) => api.get(`/api/phishing/campaigns/${id}/recipients`);
export const getCampaignStats = (id) => api.get(`/api/phishing/campaigns/${id}/stats`);

// 자산 관리
export const getAssets = (params) => api.get('/api/assets/', { params });
export const getAsset = (id) => api.get(`/api/assets/${id}`);
export const createAsset = (data) => api.post('/api/assets/', data);
export const updateAsset = (id, data) => api.put(`/api/assets/${id}`, data);
export const deleteAsset = (id) => api.delete(`/api/assets/${id}`);

// CVE 모니터링
export const getCVEAlerts = (params) => api.get('/api/cve/alerts', { params });
export const getCVEAlert = (id) => api.get(`/api/cve/alerts/${id}`);
export const scanAssetCVEs = (assetId) => api.post(`/api/cve/scan/${assetId}`);
export const scanAllAssets = () => api.post('/api/cve/scan/all');

