import { useQuery } from '@tanstack/react-query';
import type { ListViewingRequestsInput } from '@/entities/viewing-request';
import { agentViewingRequestService } from '../services/agent-viewing-request.service';

/** BOOK-001. */
export function useAgentViewingRequests(input?: ListViewingRequestsInput) {
  return useQuery({
    queryKey: ['viewingRequests', 'agent', input],
    queryFn: () => agentViewingRequestService.listForAgent(input),
    staleTime: 30_000,
  });
}
