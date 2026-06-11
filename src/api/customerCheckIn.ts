import api from './axios';

export interface CustomerCheckInRecord {
  id: number;
  customer_id: number;
  branch_id: number;
  check_in_time: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: number;
    user_id: number;
    user?: {
      id: number;
      full_name: string;
      email: string;
      phone_number?: string;
    };
  };
  branch?: {
    id: number;
    branch_name: string;
    address: string;
    image_url?: string;
  };
}

export interface CustomerCheckInRequest {
  branch_id: number;
  dynamic_qr_token?: string;
}

export const customerCheckInApi = {
  checkIn: (data: CustomerCheckInRequest) => {
    return api.post<{ message: string; checkIn: CustomerCheckInRecord }>('/customer-check-ins/check-in', data);
  },

  getMyLogs: () => {
    return api.get<CustomerCheckInRecord[]>('/customer-check-ins/my-logs');
  },

  getAllForAdmin: (params?: { customer_id?: number | string; branch_id?: number | string; date?: string }) => {
    return api.get<CustomerCheckInRecord[]>('/customer-check-ins/admin', { params });
  },

  getAllForBranch: (params?: { customer_id?: number | string; branch_id?: number | string; date?: string }) => {
    return api.get<CustomerCheckInRecord[]>('/customer-check-ins/branch', { params });
  },
};
export default customerCheckInApi;
