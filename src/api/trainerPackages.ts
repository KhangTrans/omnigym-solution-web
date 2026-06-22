import api from './axios';

export interface TrainerPackage {
  id: number;
  package_name: string;
  session_count: number;
  package_price: number;
  price_per_session: number;
  trainer_level: 'junior' | 'senior' | 'master';
  mode: '1-on-1' | 'group';
  description?: string;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TrainerPackagePayload = Omit<
  TrainerPackage,
  'id' | 'price_per_session' | 'created_at' | 'updated_at'
>;

export const trainerPackagesApi = {
  getAll: () => api.get<TrainerPackage[]>('/trainer-packages'),
  getById: (id: number) => api.get<TrainerPackage>(`/trainer-packages/${id}`),
  create: (data: TrainerPackagePayload) => api.post('/trainer-packages', data),
  update: (id: number, data: Partial<TrainerPackagePayload>) =>
    api.put(`/trainer-packages/${id}`, data),
};
