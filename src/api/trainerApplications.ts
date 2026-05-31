import api from "./axios";

export const trainerApplicationAPI = {
  submit: (payload: any) => {
    return api.post("/trainer-applications", payload);
  },

  getMe: () => {
    return api.get("/trainer-applications/me");
  },

  getAll: () => {
    return api.get("/trainer-applications");
  },

  getOne: (id: number) => {
    return api.get(`/trainer-applications/${id}`);
  },

  approve: (id: number) => {
    return api.patch(`/trainer-applications/${id}/approve`);
  },

  reject: (id: number, rejection_reason: string) => {
    return api.patch(`/trainer-applications/${id}/reject`, {
      rejection_reason,
    });
  },
};
