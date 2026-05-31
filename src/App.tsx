import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { Toaster } from './components/ui/sonner';
import './App.css'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" richColors closeButton />
    </>
  )
}

export default App

