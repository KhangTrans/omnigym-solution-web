import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  withCredentials: true, // Quan trọng để làm việc với Express-Session (Cookie)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để xử lý lỗi tập trung (Optionally)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 (Hết hạn session) hoặc các lỗi khác ở đây
    return Promise.reject(error);
  }
);

export default api;
