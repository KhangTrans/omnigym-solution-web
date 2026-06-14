import api from "./axios";

export interface Trainer {
  id: number;
  user_id: number;
  branch_id?: number;
  bio?: string;
  specialization?: string;
  rating: number;
  years_experience: number;
  level?: "junior" | "senior" | "master";
  application_id?: number;
  avatar_url?: string;
  phone_number?: string;
  address?: string;
  hourly_rate?: number;
  review_count: number;
  is_active: boolean;
  approved_at?: string;
  user?: {
    id: number;
    email: string;
    full_name: string;
    avatar_url?: string;
    status: string;
  };
  branch?: {
    id: number;
    branch_name: string;
    address: string;
    province?: string;
    district?: string;
  };
}

export const trainersApi = {
  getApproved: () => {
    return api.get<{ status: string; data: Trainer[] }>("/trainers/approved");
  },
};
