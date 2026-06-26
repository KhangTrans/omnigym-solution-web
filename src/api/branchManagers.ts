import api from "./axios";

export interface BranchManagerUser {
  id: number;
  full_name: string;
  email: string;
  phone_number?: string;
  status: string;
  created_at: string;
  role: { role_name: string };
  manager?: {
    id: number;
    branch_id: number;
    branch?: {
      branch_name: string;
    };
  };
}

export type ManagerAccountStatus = "active" | "locked";

export const branchManagerAPI = {
  create: (payload: any) => api.post("/branch-managers", payload),
  getAll: () => api.get<{ data: BranchManagerUser[] }>("/branch-managers"),
  updateStatus: (id: number, status: ManagerAccountStatus) =>
    api.patch(`/users/${id}/status`, { status }),
};
