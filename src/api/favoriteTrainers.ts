import api from "./axios";

/**
 * Trainer card đã được lưu vào favorites — đủ field render UI card list.
 */
export interface FavoriteTrainerItem {
  favorite_id: number;
  favorited_at: string;
  trainer: {
    id: number;
    user_id: number;
    full_name: string | null;
    avatar_url: string | null;
    specialization: string | null;
    level: string | null;
    years_experience: number;
    rating: number;
    review_count: number;
    hourly_rate: number | null;
    is_active: boolean;
    branch: {
      id: number;
      branch_name: string;
      province: string | null;
      district: string | null;
    } | null;
  };
}

interface FavoriteToggleData {
  trainer_id: number;
  is_favorited: boolean;
  favorite_id?: number;
}

interface FavoriteStatusData {
  trainer_id: number;
  is_favorited: boolean;
}

/**
 * API client cho chức năng "Trainer yêu thích".
 * Tất cả endpoint yêu cầu user đăng nhập — token được tự động gắn
 * qua axios interceptor (`src/api/axios.ts`).
 */
export const favoriteTrainerAPI = {
  /** GET /api/favorites/trainers — danh sách trainer đã lưu của user hiện tại. */
  getMyFavorites: () =>
    api.get<{ message: string; data: FavoriteTrainerItem[] }>(
      "/favorites/trainers",
    ),

  /** GET /api/favorites/trainers/:trainerId/status — kiểm tra đã lưu chưa. */
  getStatus: (trainerId: number | string) =>
    api.get<{ message: string; data: FavoriteStatusData }>(
      `/favorites/trainers/${trainerId}/status`,
    ),

  /** POST /api/favorites/trainers/:trainerId — thêm vào danh sách yêu thích. */
  add: (trainerId: number | string) =>
    api.post<{ message: string; data: FavoriteToggleData }>(
      `/favorites/trainers/${trainerId}`,
    ),

  /** DELETE /api/favorites/trainers/:trainerId — bỏ khỏi danh sách yêu thích. */
  remove: (trainerId: number | string) =>
    api.delete<{ message: string; data: FavoriteToggleData }>(
      `/favorites/trainers/${trainerId}`,
    ),
};
