export type Role = 'admin' | 'vendor';

export interface User {
  id: string;
  supabaseId: string;
  name: string;
  email: string;
  role: Role;
  defaultCompanyId: string | null;
  lastUsedCompanyId: string | null;
  mustChangePassword?: boolean;
  createdAt: string;
  updatedAt: string;
  companyCount?: number;
  assignedCompanies?: Company[];
}

export interface Company {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  accentColor: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  vendorCount?: number;
}

export interface Referral {
  id: string;
  name: string;
  email: string;
  productInfo: string;
  referenceLinks: string[];
  hostName: string;
  hostEmail: string;
  vendorId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  vendorName?: string;
  companyName?: string;
}

export interface VerifyTokenResponse {
  role: Role;
  lastUsedCompanyId: string | null;
  mustChangePassword?: boolean;
  name: string;
  email: string;
  id: string;
  supabaseId: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pageSize: number;
  [key: string]: T[] | number;
}

export interface DashboardStats {
  totalVendors?: number;
  totalCompanies?: number;
  totalReferrals?: number;
  recentReferrals?: Referral[];
  referralCount?: number;
}
