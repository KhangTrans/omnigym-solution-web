import { Navigate } from "react-router-dom";

function getCurrentRole() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const roleValue =
      typeof user?.role === "object"
        ? user?.role?.role_name || user?.role?.name
        : user?.role;
    const role = String(roleValue || "").toLowerCase();
    if (role) return role;
    if (Number(user?.role_id) === 4) return "staff";
    if (Number(user?.role_id) === 3) return "branchmanager";
    return "";
  } catch {
    return "";
  }
}

export function RoleOnly({
  allow,
  children,
}: {
  allow: string[];
  children: React.ReactElement;
}) {
  const role = getCurrentRole();
  return allow.includes(role) ? children : <Navigate to="/branchmanager" replace />;
}

export function DashboardRedirect() {
  let redirectTo = "/";

  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      const roleValue =
        typeof user?.role === "object"
          ? user?.role?.role_name || user?.role?.name
          : user?.role;
      const role = String(roleValue || "").toLowerCase();

      if (role === "trainer") {
        redirectTo = "/trainer-join";
      } else if (role === "admin" || [1, 2].includes(Number(user?.role_id))) {
        redirectTo = "/admin";
      } else if (["branchmanager", "staff", "gym", "partner"].includes(role) || [3, 4].includes(Number(user?.role_id))) {
        redirectTo = "/branchmanager";
      }
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }

  return <Navigate to={redirectTo} replace />;
}