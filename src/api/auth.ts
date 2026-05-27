import api from './axios';

export const authApi = {
  // Gửi mã OTP
  requestOTP: (identifier: string) => {
    return api.post('/auth/request-otp', { identifier });
  },

  // Đăng ký tài khoản
  register: (payload: any) => {
    return api.post('/auth/register', payload);
  },

  // Đăng nhập
  login: (credentials: any) => {
    return api.post('/auth/login', credentials);
  },

  // Đăng nhập bằng Google
  googleLogin: (idToken: string) => {
    return api.post('/auth/google-login', { idToken });
  },

  // Đăng xuất
  logout: () => {
    return api.post('/auth/logout');
  },

  // Lấy thông tin người dùng hiện tại
  getMe: () => {
    return api.get('/auth/me');
  },

  // Quên mật khẩu - Gửi OTP
  forgotPassword: (email: string) => {
    return api.post('/auth/forgot-password', { email });
  },

  // Đặt lại mật khẩu mới
  resetPassword: (payload: any) => {
    return api.post('/auth/reset-password', payload);
  }
};
