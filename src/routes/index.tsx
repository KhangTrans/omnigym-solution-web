import { createBrowserRouter, Navigate } from 'react-router-dom';
import Register from '../pages/pubblic/Register';

// JSON-like configuration array
export const routesConfig = [
  {
    path: '/',
    element: <Navigate to="/register" replace />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/login',
    element: (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Login Page Placeholder</h1>
        <a href="/register" className="ml-4 text-primary underline">Go to Register</a>
      </div>
    ),
  },
  // Add other routes here following the same pattern
  {
    path: '*',
    element: <div className="p-8 text-center">404 - Not Found</div>,
  },
];

const router = createBrowserRouter(routesConfig);

export default router;
