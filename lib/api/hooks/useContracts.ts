import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createContract, 
  getContractsByCompany, 
  getContractsByVendor 
} from '../client';

export function useContracts(params?: { companyId?: string; vendorId?: string }) {
  const queryClient = useQueryClient();
  const { companyId, vendorId } = params || {};

  const contractsQuery = useQuery({
    queryKey: ['contracts', { companyId, vendorId }],
    queryFn: () => {
      if (companyId) return getContractsByCompany(companyId);
      if (vendorId) return getContractsByVendor(vendorId);
      return [];
    },
    enabled: !!companyId || !!vendorId,
  });

  const createMutation = useMutation({
    mutationFn: createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });

  return {
    contracts: contractsQuery.data,
    isLoading: contractsQuery.isLoading,
    createContract: createMutation.mutate,
    isCreating: createMutation.isPending,
    error: contractsQuery.error,
  };
}