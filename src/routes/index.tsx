import { createBrowserRouter, Navigate, Link } from 'react-router-dom';
import Register from '../pages/pubblic/Register';
import Login from '../pages/pubblic/Login';
import ForgotPassword from '../pages/pubblic/ForgotPassword';
import Home from '../pages/pubblic/Home';
import AuthLayout from '../layouts/AuthLayout';
import AdminLayout from '../layouts/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import AdminProfile from '../pages/admin/Profile';
import UsersManagement from '../pages/admin/Users';
import Revenue from '../pages/admin/Revenue';
import Transactions from '../pages/admin/Transactions';
import GymsManagement from '../pages/admin/Gyms';
import Payouts from '../pages/admin/Payouts';
import Refunds from '../pages/admin/Refunds';
import Moderation from '../pages/admin/Moderation';
import Exercises from '../pages/admin/Exercises';
import Library from '../pages/admin/Library';
import CustomerProfile from '../pages/customers/Profile';

// JSON-like configuration array
export const routesConfig = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/profile',
    element: <CustomerProfile />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'revenue',
        element: <Revenue />,
      },
      {
        path: 'transactions',
        element: <Transactions />,
      },
      {
        path: 'users',
        element: <UsersManagement />,
      },
      {
        path: 'gyms',
        element: <GymsManagement />,
      },
      {
        path: 'payouts',
        element: <Payouts />,
      },
      {
        path: 'refunds',
        element: <Refunds />,
      },
      {
        path: 'moderation',
        element: <Moderation />,
      },
      {
        path: 'exercises',
        element: <Exercises />,
      },
      {
        path: 'library',
        element: <Library />,
      },
      {
        path: 'profile',
        element: <AdminProfile />,
      },
    ],
  },
  {
    path: '/dashboard',
    element: <Navigate to="/admin" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPassword />,
      },
    ],
  },
  // Add other routes here following the same pattern
  {
    path: '*',
    element: <div className="p-8 text-center border mt-10 rounded-xl max-w-md mx-auto">
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="text-slate-500 mt-2">Trang bạn tìm kiếm không tồn tại.</p>
      <Link to="/" className="text-emerald-600 hover:scale-105 inline-block mt-4">Quay lại trang chủ</Link>
    </div>,
  },
];

const router = createBrowserRouter(routesConfig);

export default router;
