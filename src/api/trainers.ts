import api from "./axios";

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
  getById: (id: number | string) =>
    api.get<{ message: string; data: PublicTrainerDetail }>(`/trainers/${id}`),
};
