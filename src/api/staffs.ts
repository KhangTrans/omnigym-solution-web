import api from './axios';

export type CreateStaffPayload = {
  full_name: string;
  email: string;
  password: string;
  phone_number?: string;
  department?: string;
  branch_id?: number;
  avatar_url?: string;
};

export type StaffUser = {
  id: number;
  full_name?: string;
  email?: string;
  phone_number?: string;
  avatar_url?: string;
  status?: string;
  role_id?: number;
  created_at?: string;
  role?: { id: number; role_name: string };
  staff?: {
    id: number;
    user_id: number;
    branch_id?: number;
    department?: string;
    branch?: { id: number; branch_name?: string };
  };
};

export const staffAPI = {
  create: (payload: CreateStaffPayload) =>
    api.post('/staffs', payload),

  list: () =>
    api.get<{ message: string; data: StaffUser[] }>('/staffs'),

  updateStatus: (id: number, status: 'active' | 'locked') =>
    api.patch(`/staffs/${id}/status`, { status }),
};
