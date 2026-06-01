import api from './axios';

export interface Branch {
  id: number;
  address: string;
  [key: string]: any;
}

export interface MembershipPackage {
  id: number;
  name: string;
  price: string;
  duration_months: number;
  description: string;
  benefits: string;
  status: 'active' | 'inactive';
  branches?: Branch[];
  branch_ids?: number[];
  apply_to_all?: boolean;
  created_at: string;
  updated_at: string;
}

export const membershipPackagesApi = {
  getAll: () => {
    return api.get<MembershipPackage[]>('/membership-packages');
  },

  getById: (id: number) => {
    return api.get<MembershipPackage>(`/membership-packages/${id}`);
  },

  create: (data: Omit<MembershipPackage, 'id' | 'created_at' | 'updated_at'>) => {
    return api.post<MembershipPackage>('/membership-packages', data);
  },

  update: (id: number, data: Partial<Omit<MembershipPackage, 'id' | 'created_at' | 'updated_at'>>) => {
    return api.put<MembershipPackage>(`/membership-packages/${id}`, data);
  },

  delete: (id: number) => {
    return api.delete(`/membership-packages/${id}`);
  },
};
