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

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type UserListResponse = {
  data: ApiUser[];
  pagination: PaginationMeta;
};

export type UserListParams = {
  page?: number;
  limit?: number;
  /** Role name: 'Customer' | 'Trainer' | 'Staff' — omit to get all allowed roles */
  role?: string;
  /** Status: 'active' | 'locked' — omit to get all statuses */
  status?: string;
};

export const usersApi = {
  list: (params?: UserListParams) =>
    api.get<UserListResponse>('/users', { params }),
  updateStatus: (id: number, status: UserStatus) =>
    api.patch(`/users/${id}/status`, { status }),
};
