import axios from 'axios';

// 環境変数からAPIのベースURLを取得
// 本番環境では VITE_API_BASE_URL を設定、開発環境ではlocalhostを使用
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 型定義
interface PVTResult {
  id?: number;
  miss_count: number;
  average_reaction_time: number;
  all_reaction_times: number[];
  completed_at?: string;
}

interface FlankerTrial {
  stimulus: string;
  correct: boolean;
  reaction_time_ms: number;
  congruent: boolean;
}

interface FlankerResult {
  id?: number;
  total_correct: number;
  congruent_correct: number;
  incongruent_correct: number;
  total_trials: number;
  trial_details?: FlankerTrial[];
  completed_at?: string;
}

interface EFSIResult {
  id?: number;
  total_score: number;
  answers: number[];
  completed_at?: string;
}

interface VASResult {
  id?: number;
  sleepiness_score: number;
  fatigue_score: number;
  completed_at?: string;
}

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
  create: async (data: Omit<EFSIResult, 'id' | 'completed_at' | 'total_score'>) => {
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
