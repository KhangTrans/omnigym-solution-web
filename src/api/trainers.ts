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

export interface TrainerScheduleSlot {
  start_time: string;
  end_time: string;
  status: "available" | "booked";
}

export interface TrainerScheduleShift {
  date: string;
  work_shift_id: number;
  shift: {
    id: number;
    shift_name: string;
    start_time: string;
    end_time: string;
  } | null;
  slots: TrainerScheduleSlot[];
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
  getSchedule: (id: number | string, startDate?: string, endDate?: string) =>
    api.get<{ message: string; data: TrainerScheduleShift[] }>(
      `/trainers/${id}/schedule`,
      { params: { start_date: startDate, end_date: endDate } }
    ),
  bookSlot: (payload: {
    trainer_id: number;
    date?: string;
    time?: string;
    slots?: Array<{ date: string; time: string }>;
  }) => api.post<{ message: string; data: any }>("/bookings", payload),
  rescheduleBooking: (bookingId: number, payload: { new_date: string; new_time: string }) =>
    api.put<{ message: string; data: any }>(`/bookings/${bookingId}/reschedule`, payload),
  getMyBookings: () =>
    api.get<{ message: string; data: any[] }>("/bookings/my-bookings"),
  cancelBooking: (bookingId: number) =>
    api.post<{ message: string }>(`/bookings/${bookingId}/cancel`),
  confirmCompletion: (bookingId: number) =>
    api.post<{ message: string; data: any }>(`/bookings/${bookingId}/confirm-completion`),
  trainerConfirmCompletion: (bookingId: number) =>
    api.post<{ message: string; data: any }>(`/bookings/${bookingId}/trainer-confirm-completion`),
  getTrainerBookings: (startDate?: string, endDate?: string) =>
    api.get<{ message: string; data: any[] }>("/bookings/trainer", {
      params: { start_date: startDate, end_date: endDate }
    }),
  updateBooking: (bookingId: number, payload: { status?: string; note?: string }) =>
    api.put<{ message: string; data: any }>(`/bookings/${bookingId}`, payload),
};