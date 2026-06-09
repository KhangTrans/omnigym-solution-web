import api from './axios';

export interface AttendanceRecord {
  id: number;
  shift_id: number;
  user_id: number;
  check_in_time?: string;
  check_out_time?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  user?: {
    id: number;
    full_name: string;
    email: string;
    phone_number?: string;
  };
  shift?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
    branch_id: number;
    branch?: {
      id: number;
      branch_name: string;
      address: string;
    };
  };
}

export interface CheckInRequest {
  shift_id: number;
  check_in_code?: string;
  dynamic_qr_token?: string;
}

export interface CheckOutRequest {
  shift_id?: number;
}

export interface QrTokenResponse {
  dynamic_qr_token: string;
  expires_in_seconds: number;
}

export const attendanceApi = {
  checkIn: (data: CheckInRequest) => {
    return api.post('/attendances/check-in', data);
  },

  checkOut: (data: CheckOutRequest) => {
    return api.post('/attendances/check-out', data);
  },

  getMyLogs: () => {
    return api.get<{ data: AttendanceRecord[] }>('/attendances/my-logs');
  },

  getBranchQr: (branchId: number | string) => {
    return api.get<{ data: QrTokenResponse }>(`/attendances/branch-qr/${branchId}`);
  },

  getAll: (params?: { date?: string; branch_id?: number | string }) => {
    return api.get<{ data: AttendanceRecord[] }>('/attendances', { params });
  },

  update: (id: number | string, data: { check_in_time?: string; check_out_time?: string; status?: string; notes?: string }) => {
    return api.put(`/attendances/${id}`, data);
  },
};
