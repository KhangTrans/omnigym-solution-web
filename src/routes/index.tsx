import { createBrowserRouter, Link, type RouteObject } from "react-router-dom";
import Register from "../pages/pubblic/Register";
import Login from "../pages/pubblic/Login";
import ForgotPassword from "../pages/pubblic/ForgotPassword";
import ChangePassword from "../pages/customers/ChangePassword";
import CustomerCheckIn from "../pages/customers/CheckIn";
import Home from "../pages/pubblic/Home";
import TrainerJoin from "../pages/pubblic/TrainerJoin";
import BlogList from "../pages/pubblic/BlogList";
import BlogDetail from "../pages/pubblic/BlogDetail";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import CustomerLayout from "../layouts/CustomerLayout";
import Dashboard from "../pages/admin/dashboard_management/Dashboard";
import AdminProfile from "../pages/admin/profile/Profile";
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
import FavoriteTrainers from "../pages/customers/FavoriteTrainers";
import BranchList from "../pages/admin/branch_management/BranchList";
import CreateBranch from "../pages/admin/branch_management/CreateBranch";
import MembershipPackage from "@/pages/admin/membership_packages/MembershipPackage";
import TrainerPackages from "@/pages/admin/trainer_packages/TrainerPackages";
import TrainerApplicationList from "@/pages/admin/trainer_applications/TrainerApplicationList";
import Gyms from "../pages/pubblic/branches/Gyms";
import GymDetail from "../pages/pubblic/branches/GymDetail";
import TrainerDetail from "../pages/pubblic/trainers/TrainerDetail";
import ShiftAttendance from "../pages/staffs/ShiftAttendance";
import StaffSchedule from "../pages/staffs/StaffSchedule";
import AttendanceManagement from "../pages/admin/attendance_management/AttendanceManagement";
import Checkout from "../pages/customers/transaction/Checkout";
import PaymentSuccess from "../pages/customers/transaction/PaymentSuccess";
import PaymentCancel from "../pages/customers/transaction/PaymentCancel";
import CustomerAttendance from "../pages/admin/attendance_management/CustomerAttendance";
import WorkspaceShell from "../pages/branchmanager/WorkspaceShell";
import WorkspaceDashboard from "../pages/branchmanager/WorkspaceDashboard";
import BranchManagerTrainerApplications from "../pages/branchmanager/BranchManagerTrainerApplications";
import BranchManagerPosts from "../pages/branchmanager/BranchManagerPosts";
import BranchManagerAttendance from "../pages/branchmanager/BranchManagerAttendance";
import BranchManagerCustomerCheckin from "../pages/branchmanager/BranchManagerCustomerCheckin";
import BranchManagerStaff from "../pages/branchmanager/BranchManagerStaff";
import BranchManagerRevenue from "../pages/branchmanager/BranchManagerRevenue";
import BranchManagerStaffAttendance from "../pages/branchmanager/BranchManagerStaffAttendance";
import StaffAccounts from "../pages/admin/staff_accounts/StaffAccounts";
import BranchManagerAccounts from "../pages/admin/branch_manager_accounts/BranchManagerAccounts";
import BranchManagerTrainers from "../pages/branchmanager/BranchManagerTrainers";
import AdminTrainers from "../pages/admin/trainers/AdminTrainers";
import TrainerDashboard from "../pages/trainer/TrainerDashboard";
import { DashboardRedirect, RoleOnly } from "./routeGuards";

export const routesConfig: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/trainer-join",
    element: <TrainerJoin />,
  },
  {
    path: "/trainer",
    element: <TrainerDashboard />,
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
    path: "/trainers/:id",
    element: <TrainerDetail />,
  },
  {
    path: "/blog",
    element: <BlogList />,
  },
  {
    path: "/blog/:slug",
    element: <BlogDetail />,
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
      {
        path: "/check-in",
        element: <CustomerCheckIn />,
      },
      {
        path: "/favorites/trainers",
        element: <FavoriteTrainers />,
      },
    ],
  },
  {
    path: "/checkout/:packageId",
    element: <Checkout />,
  },
  {
    path: "/payment/success",
    element: <PaymentSuccess />,
  },
  {
    path: "/payment/cancel",
    element: <PaymentCancel />,
  },
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "revenue", element: <Revenue /> },
      { path: "transactions", element: <Transactions /> },
      { path: "users", element: <UsersManagement /> },
      { path: "gyms", element: <GymsManagement /> },
      {
        path: "branch-management",
        children: [
          { index: true, element: <BranchList /> },
          { path: "create", element: <CreateBranch /> },
        ],
      },
      { path: "payouts", element: <Payouts /> },
      { path: "refunds", element: <Refunds /> },
      { path: "moderation", element: <Moderation /> },
      { path: "exercises", element: <Exercises /> },
      { path: "library", element: <Library /> },
      { path: "blogs", element: <PostManagement /> },
      { path: "faq", element: <FAQ /> },
      { path: "profile", element: <AdminProfile /> },
      { path: "membership-packages", element: <MembershipPackage /> },
      { path: "trainer-packages", element: <TrainerPackages /> },
      { path: "trainer-applications", element: <TrainerApplicationList /> },
      { path: "shift-attendance", element: <ShiftAttendance /> },
      { path: "attendance-management", element: <AttendanceManagement /> },
      { path: "customer-attendance", element: <CustomerAttendance /> },
      { path: "staff-accounts", element: <StaffAccounts /> },
      { path: "branch-managers", element: <BranchManagerAccounts /> },
      { path: "trainers", element: <AdminTrainers /> },
    ],
  },
  { path: "/dashboard", element: <DashboardRedirect /> },
  {
    path: "/branchmanager",
    element: <WorkspaceShell />,
    children: [
      { index: true, element: <WorkspaceDashboard /> },
      {
        path: "trainer-applications",
        element: (
          <RoleOnly allow={["branchmanager"]}>
            <BranchManagerTrainerApplications />
          </RoleOnly>
        ),
      },
      {
        path: "trainers",
        element: (
          <RoleOnly allow={["branchmanager", "staff"]}>
            <BranchManagerTrainers />
          </RoleOnly>
        ),
      },
      { path: "posts", element: <BranchManagerPosts /> },
      { path: "attendance", element: <BranchManagerAttendance /> },
      { path: "customer-checkin", element: <BranchManagerCustomerCheckin /> },
      {
        path: "users",
        element: (
          <RoleOnly allow={["branchmanager"]}>
            <BranchManagerStaff />
          </RoleOnly>
        ),
      },
      {
        path: "staff-schedule",
        element: (
          <RoleOnly allow={["staff"]}>
            <StaffSchedule />
          </RoleOnly>
        ),
      },
      {
        path: "staff-attendance",
        element: (
          <RoleOnly allow={["staff"]}>
            <BranchManagerStaffAttendance />
          </RoleOnly>
        ),
      },
      { path: "revenue", element: <BranchManagerRevenue /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/register", element: <Register /> },
      { path: "/login", element: <Login /> },
      { path: "/forgot-password", element: <ForgotPassword /> },
    ],
  },
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
] ;

const router = createBrowserRouter(routesConfig);
export default router;
export { router };
