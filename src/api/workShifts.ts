import api from './axios';

export interface WorkShift {
  id: number;
  user_id: number;
  branch_id: number;
  date: string;
  start_time: string;
  end_time: string;
  check_in_code: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  user?: {
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  branch?: {
    id: number;
    branch_name: string;
    address: string;
  };
}

export interface CreateShiftRequest {
  user_id: number;
  branch_id: number;
  date: string;
  start_time: string;
  end_time: string;
  check_in_code: string;
}

export interface UpdateShiftRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  check_in_code?: string;
}

export const workShiftsApi = {
  list: (params?: { date?: string }) => {
    return api.get<{ data: WorkShift[] }>('/work-shifts', { params });
  },

  getMyShifts: (params?: { date?: string }) => {
    return api.get<{ message: string; data: WorkShift[] }>('/work-shifts/me', { params });
  },

  create: (data: CreateShiftRequest) => {
    return api.post<{ data: WorkShift }>('/work-shifts', data);
  },

  update: (id: number | string, data: UpdateShiftRequest) => {
    return api.put<{ data: WorkShift }>(`/work-shifts/${id}`, data);
  },

  delete: (id: number | string) => {
    return api.delete(`/work-shifts/${id}`);
  },
};
