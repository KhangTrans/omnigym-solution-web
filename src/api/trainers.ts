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

export type TrainerAccountStatus = "active" | "locked";

export interface PublicTrainerCertificate {
  id: number;
  cert_name: string | null;
  issued_by: string | null;
  certificate_number: string | null;
  image_url: string | null;
  issued_at: string | null;
  expires_at: string | null;
}

export interface PublicTrainerPackage {
  id: number;
  package_name: string;
  session_count: number;
  package_price: number;
  price_per_session: number;
  trainer_level: string;
  mode: string;
  description: string | null;
}

export interface PublicTrainerBranch {
  id: number;
  branch_name: string;
  province: string | null;
  district: string | null;
  address: string | null;
  hotline: string | null;
  image_url: string | null;
}

export interface PublicTrainerReview {
  id: number;
  author: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface PublicTrainerDetail {
  id: number;
  user_id: number;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  specialization: string | null;
  level: string | null;
  years_experience: number;
  rating: number;
  review_count: number;
  hourly_rate: number | null;
  phone_number: string | null;
  address: string | null;
  is_active: boolean;
  approved_at: string | null;
  branch: PublicTrainerBranch | null;
  user: {
    id: number;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
  } | null;
  certificates: PublicTrainerCertificate[];
  packages: PublicTrainerPackage[];
  reviews: PublicTrainerReview[];
}

export const trainersApi = {
  getApproved: () => {
    return api.get<{ status: string; data: Trainer[] }>("/trainers/approved");
  },
  updateStatus: (id: number, status: TrainerAccountStatus) => {
    return api.patch<{ message: string; data: Trainer }>(
      `/trainers/${id}/status`,
      { status },
    );
  },
  getById: (id: number | string) =>
    api.get<{ message: string; data: PublicTrainerDetail }>(`/trainers/${id}`),
};