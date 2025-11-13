import axios from 'axios';
import type { PVTResult, FlankerResult, EFSIResult, VASResult, AllTasksResult } from '../types/tasks';

// 環境変数からAPIのベースURLを取得
// 本番環境では VITE_API_BASE_URL を設定、開発環境ではlocalhostを使用
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// PVT API
export const pvtApi = {
  create: async (data: Omit<PVTResult, 'id' | 'completed_at'>) => {
    const response = await api.post<PVTResult>('/tasks/pvt', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get<PVTResult[]>('/tasks/pvt');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<PVTResult>(`/tasks/pvt/${id}`);
    return response.data;
  },
};

// Flanker API
export const flankerApi = {
  create: async (data: Omit<FlankerResult, 'id' | 'completed_at'>) => {
    const response = await api.post<FlankerResult>('/tasks/flanker', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get<FlankerResult[]>('/tasks/flanker');
    return response.data;
  },
};

// EFSI API
export const efsiApi = {
  create: async (data: Omit<EFSIResult, 'id' | 'completed_at'>) => {
    const response = await api.post<EFSIResult>('/tasks/efsi', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get<EFSIResult[]>('/tasks/efsi');
    return response.data;
  },
};

// VAS API
export const vasApi = {
  create: async (data: Omit<VASResult, 'id' | 'completed_at'>) => {
    const response = await api.post<VASResult>('/tasks/vas', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get<VASResult[]>('/tasks/vas');
    return response.data;
  },
};

// All Tasks API
export const allTasksApi = {
  create: async (data: {
    pvt: Omit<PVTResult, 'id' | 'completed_at'>;
    flanker: Omit<FlankerResult, 'id' | 'completed_at'>;
    efsi: Omit<EFSIResult, 'id' | 'completed_at'>;
    vas: Omit<VASResult, 'id' | 'completed_at'>;
  }) => {
    const response = await api.post<AllTasksResult>('/tasks/all', data);
    return response.data;
  },
  saveToNotion: async (data: {
    pvt: Omit<PVTResult, 'id' | 'completed_at'>;
    flanker: Omit<FlankerResult, 'id' | 'completed_at'>;
    efsi: Omit<EFSIResult, 'id' | 'completed_at'>;
    vas: Omit<VASResult, 'id' | 'completed_at'>;
  }) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      notion_page_id: string;
      notion_url: string;
    }>('/tasks/notion/save', data);
    return response.data;
  },
};
