import { User } from './api/types';

export type { Role, User as ApiUser, VerifyTokenResponse, DashboardStats } from './api/types';

export interface Company {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  accent_color: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  vendor_count?: number;
  vendor?: User
}

export interface Referral {
  id: string;
  name: string;
  email: string;
  product_info: string;
  reference_links: string[];
  host_name: string | null;
  host_email: string | null;
  vendor_id: string;
  company_id: string;
  created_at: string;
  updated_at: string;
  vendor_name?: string;
  company_name?: string;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor';
  default_company_id: string | null;
  last_used_company_id: string | null;
  must_change_password?: boolean;
  assignedCompanies?: Company[];
  created_at: string;
  updated_at: string;
}

export function toProfile(user: {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor';
  defaultCompanyId?: string | null;
  lastUsedCompanyId?: string | null;
  mustChangePassword?: boolean;
  assignedCompanies?: Parameters<typeof toCompany>[0][];
  createdAt?: string;
  updatedAt?: string;
}): Profile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    default_company_id: user.defaultCompanyId ?? null,
    last_used_company_id: user.lastUsedCompanyId ?? null,
    must_change_password: user.mustChangePassword ?? false,
    assignedCompanies: user.assignedCompanies?.map(toCompany),
    created_at: user.createdAt ?? new Date().toISOString(),
    updated_at: user.updatedAt ?? new Date().toISOString(),
  };
}

export function toReferral(r: {
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
}) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    product_info: r.productInfo,
    reference_links: r.referenceLinks,
    host_name: r.hostName,
    host_email: r.hostEmail,
    vendor_id: r.vendorId,
    company_id: r.companyId,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
    vendor_name: r.vendorName,
    company_name: r.companyName,
  };
}

export function toCompany(c: {
  id: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  accentColor?: string | null;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
  vendorCount?: number;
  vendor?: User
}) {
  return {
    id: c.id,
    name: c.name,
    description: c.description ?? null,
    logo: c.logo ?? null,
    accent_color: c.accentColor ?? null,
    status: c.status,
    created_at: c.createdAt ?? new Date().toISOString(),
    updated_at: c.updatedAt ?? new Date().toISOString(),
    vendor_count: c.vendorCount,
    vendor: c.vendor
  };
}
