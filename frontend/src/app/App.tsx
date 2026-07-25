import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { queryClient } from '@/shared/lib';
import { Toaster } from '@/shared/ui';
import { AuthProvider } from '@/entities/user';
import { router } from './router';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
