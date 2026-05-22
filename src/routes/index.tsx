import { createBrowserRouter, Navigate } from 'react-router-dom';
import Register from '../pages/pubblic/Register';
import Login from '../pages/pubblic/Login';
import ForgotPassword from '../pages/pubblic/ForgotPassword';
import AuthLayout from '../layouts/AuthLayout';

// JSON-like configuration array
export const routesConfig = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
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
    element: <div className="p-8 text-center">404 - Not Found</div>,
  },
];

const router = createBrowserRouter(routesConfig);

export default router;
