import { trainerApplicationAPI } from "./trainerApplications";
import { workShiftsApi } from "./workShifts";
import { attendanceApi } from "./attendance";
import { postsApi } from "./posts";
import { usersApi } from "./users";

export const branchWorkspaceAPI = {
  trainerApplications: trainerApplicationAPI,
  workShifts: workShiftsApi,
  attendance: attendanceApi,
  posts: postsApi,
  users: usersApi,
};
