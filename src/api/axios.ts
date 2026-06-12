import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để tự động chèn token vào header Authorization
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi tập trung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Hết hạn token hoặc token không hợp lệ -> tự động xóa session
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // Không tự chuyển hướng trực tiếp ở đây để tránh gián đoạn các luồng đặc thù,
      // hoặc bạn có thể chuyển hướng bằng cách: window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
