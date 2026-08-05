import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApplyForAgencyFormInput } from '../schemas/applyForAgency.schema';
import { agencyRegistrationService } from '../services/agency-registration.service';

export function useApplyForAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyForAgencyFormInput) => agencyRegistrationService.apply(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['agencyRegistration', 'myApplication'] });
    },
  });
}
