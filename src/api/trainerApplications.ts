import api from "./axios";

export const trainerApplicationAPI = {
  saveDraft: (payload: any) => {
    return api.post("/trainer-applications/draft", payload);
  },

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

  approve: (id: number, approved_level: "junior" | "senior" | "master") => {
    return api.patch(`/trainer-applications/${id}/approve`, { approved_level });
  },

  reject: (id: number, rejection_reason: string) => {
    return api.patch(`/trainer-applications/${id}/reject`, {
      rejection_reason,
    });
  },
};
