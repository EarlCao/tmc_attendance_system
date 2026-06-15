import axios from 'axios';

// In production (Vercel), VITE_API_URL is set to the Render backend URL e.g. https://tmc-choir-backend.onrender.com
// In development, requests go to '/' and Vite's dev proxy forwards them to localhost
const BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Add a request interceptor to inject the auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Services
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials).then(res => res.data),
  logout: () => api.post('/auth/logout').then(res => res.data),
  getMe: () => api.get('/auth/me').then(res => res.data),
};

export const membersAPI = {
  getMembers: () => api.get('/members').then(res => res.data),
  createMember: (data) => api.post('/members', data).then(res => res.data),
  updateMember: (id, data) => api.put(`/members/${id}`, data).then(res => res.data),
  deleteMember: (id) => api.delete(`/members/${id}`).then(res => res.data),
};

export const sessionsAPI = {
  getSessions: () => api.get('/sessions').then(res => res.data),
  getSession: (id) => api.get(`/sessions/${id}`).then(res => res.data),
  createSession: (data) => api.post('/sessions', data).then(res => res.data),
  updateSession: (id, data) => api.put(`/sessions/${id}`, data).then(res => res.data),
  deleteSession: (id) => api.delete(`/sessions/${id}`).then(res => res.data),
};

export const attendanceAPI = {
  getSessionAttendance: (sessionId) => api.get(`/attendance/session/${sessionId}`).then(res => res.data),
  saveSessionAttendance: (sessionId, data) => api.post(`/attendance/session/${sessionId}`, data).then(res => res.data),
  getExcuses: () => api.get('/attendance/excuses').then(res => res.data),
  updateExcuseStatus: (id, data) => api.put(`/attendance/excuses/${id}`, data).then(res => res.data),
};

export const auditionsAPI = {
  getAuditionees: () => api.get('/auditions').then(res => res.data),
  createAuditionee: (data) => api.post('/auditions', data).then(res => res.data),
  updateAuditionee: (id, data) => api.put(`/auditions/${id}`, data).then(res => res.data),
  deleteAuditionee: (id) => api.delete(`/auditions/${id}`).then(res => res.data),
  updateStatus: (id, data) => api.put(`/auditions/${id}/status`, data).then(res => res.data),
  saveEvaluation: (data) => api.post('/auditions/evaluations', data).then(res => res.data),
};

export const semestersAPI = {
  getSemesters: () => api.get('/semesters').then(res => res.data),
  createSemester: (data) => api.post('/semesters', data).then(res => res.data),
  updateSemester: (id, data) => api.put(`/semesters/${id}`, data).then(res => res.data),
  endSemester: (id) => api.post(`/semesters/${id}/end`).then(res => res.data),
  deleteSemester: (id) => api.delete(`/semesters/${id}`).then(res => res.data),
};

export const judgesAPI = {
  getJudges: (params) => api.get('/judges', { params }).then(res => res.data),
  createJudge: (data) => api.post('/judges', data).then(res => res.data),
  updateJudge: (id, data) => api.put(`/judges/${id}`, data).then(res => res.data),
  deleteJudge: (id) => api.delete(`/judges/${id}`).then(res => res.data),
};

export const officersAPI = {
  getOfficers: () => api.get('/officers').then(res => res.data),
  createOfficer: (data) => api.post('/officers', data).then(res => res.data),
  updateOfficer: (id, data) => api.put(`/officers/${id}`, data).then(res => res.data),
  deleteOfficer: (id) => api.delete(`/officers/${id}`).then(res => res.data),
};

export const rulesAPI = {
  getRules: () => api.get('/rules').then(res => res.data),
  createRule: (data) => api.post('/rules', data).then(res => res.data),
  updateRule: (id, data) => api.put(`/rules/${id}`, data).then(res => res.data),
  deleteRule: (id) => api.delete(`/rules/${id}`).then(res => res.data),
};

export const categoriesAPI = {
  getCategories: () => api.get('/categories').then(res => res.data),
  createCategory: (data) => api.post('/categories', data).then(res => res.data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data).then(res => res.data),
  deleteCategory: (id) => api.delete(`/categories/${id}`).then(res => res.data),
};

export const backupAPI = {
  exportBackup: () => api.get('/backup/export', { responseType: 'text' }),
  importBackup: (sqlText) =>
    api.post('/backup/import', sqlText, {
      headers: { 'Content-Type': 'text/plain' },
    }).then(res => res.data),
};

export const accountsAPI = {
  getAccounts: () => api.get('/accounts').then(res => res.data),
  createAccount: (data) => api.post('/accounts', data).then(res => res.data),
  createAccountForMember: (memberId) => api.post(`/accounts/member/${memberId}`).then(res => res.data),
  updateAccount: (id, data) => api.put(`/accounts/${id}`, data).then(res => res.data),
  deleteAccount: (id) => api.delete(`/accounts/${id}`).then(res => res.data),
};

export const portalAPI = {
  getDashboard: () => api.get('/portal/dashboard').then(res => res.data),
  getAttendance: () => api.get('/portal/attendance').then(res => res.data),
  getProfile: () => api.get('/portal/profile').then(res => res.data),
  updateProfile: (data) => api.put('/portal/profile', data).then(res => res.data),
};

export const auditLogsAPI = {
  getLogs: (params) => api.get('/audit-logs', { params }).then(res => res.data),
  clearLogs: () => api.delete('/audit-logs').then(res => res.data),
};

export default api;
