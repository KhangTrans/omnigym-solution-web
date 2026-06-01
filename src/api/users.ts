import api from './axios';

export type ApiRole = {
  id: number;
  role_name: string;
};

export type ApiUser = {
  id: number;
  email?: string;
  phone_number?: string;
  full_name?: string;
  status?: string;
  created_at?: string;
  role?: ApiRole;
};

export type UserStatus = 'active' | 'locked';

export const usersApi = {
  list: () => api.get<ApiUser[]>('/users'),
  updateStatus: (id: number, status: UserStatus) =>
    api.patch(`/users/${id}/status`, { status }),
};
