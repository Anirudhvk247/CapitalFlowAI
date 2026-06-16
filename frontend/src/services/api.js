import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getTodayData = (days) => api.get(days ? `/data/today?days=${days}` : '/data/today').then(res => res.data);

export const getDailyArchive = (date) => api.get(`/data/archive/daily?date=${date}`).then(res => res.data);

export const getMonthlyArchive = (month, year) => api.get(`/data/archive/monthly?month=${month}&year=${year}`).then(res => res.data);

export const syncData = (date) => api.post('/sync', date ? { date } : {}).then(res => res.data);

export const getEducationContent = () => api.get('/education').then(res => res.data);

export const getMetaDates = () => api.get('/meta/dates').then(res => res.data);

export default {
  getTodayData,
  getDailyArchive,
  getMonthlyArchive,
  syncData,
  getEducationContent,
  getMetaDates,
};
