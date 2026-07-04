import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// 从 sessionStorage 读取 token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('sessionToken');
  if (token) {
    config.headers['x-session-token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token 失效 → 清除会话
      sessionStorage.removeItem('sessionToken');
      sessionStorage.removeItem('userId');
    }
    return Promise.reject(err);
  },
);

export default api;

// === API 函数 ===

export async function createSession() {
  const { data } = await api.post('/session');
  sessionStorage.setItem('sessionToken', data.sessionToken);
  sessionStorage.setItem('userId', data.userId);
  return data;
}

export async function saveStep(step: number, stepData: Record<string, unknown>) {
  const { data } = await api.post('/assessment/step', { step, data: stepData });
  return data;
}

export async function getProgress() {
  const { data } = await api.get('/assessment/progress');
  return data;
}

export async function submitAssessment() {
  const { data } = await api.post('/assessment/submit');
  return data;
}

export async function getResults() {
  const { data } = await api.get('/results');
  return data;
}

export async function pay(planType: string) {
  const { data } = await api.post('/pay', { planType });
  return data;
}
