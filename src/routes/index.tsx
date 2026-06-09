import { createBrowserRouter, Navigate, Link } from "react-router-dom";
import Register from "../pages/pubblic/Register";
import Login from "../pages/pubblic/Login";
import ForgotPassword from "../pages/pubblic/ForgotPassword";
import ChangePassword from "../pages/customers/ChangePassword";
import Home from "../pages/pubblic/Home";
import TrainerJoin from "../pages/pubblic/TrainerJoin";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import Dashboard from "../pages/admin/dashboard_management/Dashboard";
import AdminProfile from "../pages/admin/Profile";
import UsersManagement from "../pages/admin/users_management/Users";
import Revenue from "../pages/admin/Revenue";
import Transactions from "../pages/admin/transactions_management/Transactions";
import GymsManagement from "../pages/admin/Gyms";
import Payouts from "../pages/admin/Payouts";
import Refunds from "../pages/admin/Refunds";
import Moderation from "../pages/admin/Moderation";
import Exercises from "../pages/admin/Exercises";
import Library from "../pages/admin/Library";
import PostManagement from "../pages/admin/post_management";
import FAQ from "../pages/admin/faq_management/FAQ";
import CustomerProfile from "../pages/customers/Profile";
import BranchList from "../pages/admin/branch_management/BranchList";
import CreateBranch from "../pages/admin/branch_management/CreateBranch";
import MembershipPackage from "@/pages/admin/membership_packages/MembershipPackage";
import TrainerApplicationList from "@/pages/admin/trainer_applications/TrainerApplicationList";
import Gyms from "../pages/pubblic/branches/Gyms";
import GymDetail from "../pages/pubblic/branches/GymDetail";
import ShiftAttendance from "../pages/staffs/ShiftAttendance";
import BranchQrDisplay from "../pages/admin/attendance_management/BranchQrDisplay";
import AttendanceManagement from "../pages/admin/attendance_management/AttendanceManagement";

const DashboardRedirect = () => {
  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      const role = String(user?.role || "").toLowerCase();

      if (role === "trainer") {
        return <Navigate to="/trainer-join" replace />;
      }

      // Admin, Staff, and BranchManager all use the /admin dashboard route now
      if (
        ["admin", "staff", "branchmanager", "gym"].includes(role) ||
        [1, 2, 3].includes(user?.role_id)
      ) {
        return <Navigate to="/admin" replace />;
      }
    } catch (e) {
      console.error("Error parsing user data", e);
    }
  }
  return <Navigate to="/" replace />;
};

// JSON-like configuration array
export const routesConfig = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/trainer-join",
    element: <TrainerJoin />,
  },
  {
    path: "/gyms",
    element: <Gyms />,
  },
  {
    path: "/gyms/:slug",
    element: <GymDetail />,
  },
  {
    path: "/staff/trainer-applications",
    element: <TrainerApplicationList />,
  },
  {
    element: <CustomerLayout />,
    children: [
      {
        path: "/profile",
        element: <CustomerProfile />,
      },
      {
        path: "/change-password",
        element: <ChangePassword />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "revenue",
        element: <Revenue />,
      },
      {
        path: "transactions",
        element: <Transactions />,
      },
      {
        path: "users",
        element: <UsersManagement />,
      },
      {
        path: "gyms",
        element: <GymsManagement />,
      },
      {
        path: "branch-management",
        children: [
          {
            index: true,
            element: <BranchList />,
          },
          {
            path: "create",
            element: <CreateBranch />,
          },
        ],
      },
      {
        path: "payouts",
        element: <Payouts />,
      },
      {
        path: "refunds",
        element: <Refunds />,
      },
      {
        path: "moderation",
        element: <Moderation />,
      },
      {
        path: "exercises",
        element: <Exercises />,
      },
      {
        path: "library",
        element: <Library />,
      },
      {
        path: "blogs",
        element: <PostManagement />,
      },
      {
        path: "faq",
        element: <FAQ />,
      },
      {
        path: "profile",
        element: <AdminProfile />,
      },
      {
        path: "membership-packages",
        element: <MembershipPackage />,
      },
      {
        path: "trainer-applications",
        element: <TrainerApplicationList />,
      },
      {
        path: "shift-attendance",
        element: <ShiftAttendance />,
      },
      {
        path: "attendance-management",
        element: <AttendanceManagement />,
      },
      {
        path: "branch-qr",
        element: <BranchQrDisplay />,
      },
    ],
  },
  {
    path: "/dashboard",
    element: <DashboardRedirect />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/register",
        element: <Register />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPassword />,
      },
    ],
  },
  // Add other routes here following the same pattern
  {
    path: "*",
    element: (
      <div className="p-8 text-center border mt-10 rounded-xl max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-slate-800">404</h1>
        <p className="text-slate-500 mt-2">Trang bạn tìm kiếm không tồn tại.</p>
        <Link
          to="/"
          className="text-emerald-600 hover:scale-105 inline-block mt-4"
        >
          Quay lại trang chủ
        </Link>
      </div>
    ),
  },
];

const router = createBrowserRouter(routesConfig);

export default router;
