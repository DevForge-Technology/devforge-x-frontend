import { client } from '../client';

export interface ContractPhase {
  name: string;
  dueDate: string | Date;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
}

export interface CreateContractDto {
  projectName: string;
  totalProjectValue: number;
  vendorId: string;
  companyId: string;
  phases: ContractPhase[];
}

export interface Contract {
  id: string;
  projectName: string;
  totalProjectValue: number;
  vendorId: string;
  companyId: string;
  phases: any[];
  createdAt: string;
  updatedAt: string;
}

export const contractsBuilder = {
  create: async (data: CreateContractDto): Promise<{ contract: Contract }> => {
    const { data: response } = await client.post('/contracts', data);
    return { contract: response };
  },

  getByCompany: async (companyId: string): Promise<Contract[]> => {
    const { data: response } = await client.get(`/contracts/company/${companyId}`);
    return response;
  },

  getByVendor: async (vendorId: string): Promise<Contract[]> => {
    const { data: response } = await client.get(`/contracts/vendor/${vendorId}`);
    return response;
  },
};