import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { Toaster } from './components/ui/sonner';
import { NotificationProvider } from '@/contexts/NotificationContext';
import './App.css'

function App() {
  return (
    <NotificationProvider>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </NotificationProvider>
  )
}

export default App


