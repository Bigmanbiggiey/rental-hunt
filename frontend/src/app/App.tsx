import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { queryClient } from '@/shared/lib';
import { Toaster } from '@/shared/ui/sonner';
import { AuthProvider } from '@/entities/user/context/AuthProvider';
import { IdleSessionGuard } from '@/features/authentication';
import { router } from './router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <IdleSessionGuard />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
