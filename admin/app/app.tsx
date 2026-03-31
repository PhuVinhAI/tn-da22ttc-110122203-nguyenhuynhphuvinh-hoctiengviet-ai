import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './router';
import { useAuthStore } from '../lib/state/stores/auth.store';
import { Toaster } from './components/ui/sonner';
import './styles/app.css';

export default function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // Initialize auth state from storage
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}
