import api from './axios';

export interface BranchFacility {
  facility_name: string;
  description?: string;
  icon_url?: string;
}

export interface BranchImage {
  image_url: string;
  is_cover?: boolean;
  sort_order?: number;
}

export interface CreateBranchRequest {
  partner_id: number;
  branch_name: string;
  address: string;
  province: string;
  district: string;
  hotline?: string;
  opening_house?: string;
  monthly_leave_limit?: number;
  image_url?: string;
  images?: BranchImage[];
  facilities?: BranchFacility[];
  branch_ip?: string;
}

export const branchesApi = {
  create: (data: CreateBranchRequest) => {
    return api.post('/branches', data);
  },

  update: (id: string | number, data: Partial<CreateBranchRequest>) => {
    return api.put(`/branches/${id}`, data);
  },
  
  getAll: (params?: {
    search?: string;
    province?: string;
    district?: string;
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    return api.get('/branches', { params });
  },
  
  getById: (id: string | number, params?: { trainerPage?: number; trainerLimit?: number }) => {
    return api.get(`/branches/${id}`, { params });
  },

  getReviews: (id: string | number) => {
    return api.get(`/branches/${id}/reviews`);
  },

  checkCanReview: (id: string | number) => {
    return api.get(`/branches/${id}/can-review`);
  },

  createReview: (id: string | number, data: { rating: number; comment?: string }) => {
    return api.post(`/branches/${id}/reviews`, data);
  }
};
