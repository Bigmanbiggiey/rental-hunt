import { useQuery } from '@tanstack/react-query';
import type { ListViewingRequestsInput } from '@/entities/viewing-request';
import { viewingRequestService } from '../services/viewing-request.service';

/** CUST-001/CUST-002/VIEW-005 all share this hook via different `status`/`sort` args. */
export function useViewingRequests(input?: ListViewingRequestsInput) {
  return useQuery({
    queryKey: ['viewingRequests', 'customer', input],
    queryFn: () => viewingRequestService.listForCustomer(input),
    staleTime: 30_000,
  });
}
