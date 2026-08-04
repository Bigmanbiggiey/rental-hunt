import { useMutation } from '@tanstack/react-query';
import { credentialsService } from '../services/credentials.service';

export function useSignOutOtherDevices() {
  return useMutation({
    mutationFn: () => credentialsService.signOutOtherDevices(),
  });
}
