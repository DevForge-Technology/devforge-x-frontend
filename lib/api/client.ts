/**
 * Backward-compatible API facade over axios builders.
 * Prefer react-query hooks in lib/api/hooks for new code.
 */
import { usersBuilder } from './builders/users';
import { companiesBuilder } from './builders/companies';
import { referralsBuilder } from './builders/referrals';
import { toCompany, toProfile, toReferral, type Profile, type Company, type Referral } from '../types';

export async function createVendor(name: string, email: string, companyIds: string[] = []) {
  const { user } = await usersBuilder.create({ name, email, companyIds });
  return { profile: toProfile(user) };
}

export async function deleteVendor(vendorId: string) {
  return usersBuilder.delete(vendorId);
}

export async function resetVendorPassword(vendorId: string, newPassword: string) {
  return usersBuilder.resetPassword(vendorId, newPassword);
}

export async function createCompany(data: Partial<Company> & { vendor_ids?: string[] }) {
  const { company } = await companiesBuilder.create({
    name: data.name!,
    description: data.description ?? undefined,
    logo: data.logo ?? undefined,
    accentColor: data.accent_color ?? undefined,
    status: data.status,
    vendorIds: data.vendor_ids,
  });
  return { company: toCompany(company) };
}

export async function updateCompany(id: string, data: Partial<Company> & { vendor_ids?: string[] }) {
  const { company } = await companiesBuilder.update(id, {
    name: data.name,
    description: data.description ?? undefined,
    logo: data.logo ?? undefined,
    accentColor: data.accent_color ?? undefined,
    status: data.status,
    vendorIds: data.vendor_ids,
  });
  return { company: toCompany(company) };
}

export async function deleteCompany(id: string) {
  return companiesBuilder.delete(id);
}

export async function createReferral(data: Partial<Referral>) {
  const { referral } = await referralsBuilder.create({
    name: data.name!,
    email: data.email!,
    productInfo: data.product_info!,
    referenceLinks: data.reference_links,
    hostName: data.host_name!,
    hostEmail: data.host_email!,
    companyId: data.company_id,
  });
  return { referral: toReferral(referral) };
}

export async function updateReferral(id: string, data: Partial<Referral>) {
  const { referral } = await referralsBuilder.update(id, {
    name: data.name,
    email: data.email,
    productInfo: data.product_info,
    referenceLinks: data.reference_links,
    hostName: data.host_name ?? undefined,
    hostEmail: data.host_email ?? undefined,
  });
  return { referral: toReferral(referral) };
}

export async function deleteReferral(id: string) {
  return referralsBuilder.delete(id);
}

export async function getReferrals(params?: Record<string, string>) {
  const data = await referralsBuilder.list(params);
  return { referrals: data.referrals.map(toReferral) };
}

export async function getVendors(params?: { search?: string; page?: number; page_size?: number }) {
  const data = await usersBuilder.list(params);
  return data.users.map((u) => toProfile(u)) as Profile[];
}

export async function getVendorsPage(params?: { search?: string; page?: number; page_size?: number }) {
  const data = await usersBuilder.list(params);
  return {
    vendors: data.users.map((u) => ({
      ...toProfile(u),
      companies: (u.assignedCompanies ?? []).map((c) => toCompany(c)),
    })) as (Profile & { companies: Company[] })[],
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getVendorCompanies(vendorId: string) {
  const data = await usersBuilder.getById(vendorId);
  const companies = (data as { assignedCompanies?: Parameters<typeof toCompany>[0][] }).assignedCompanies ?? [];
  return companies.map((c) => toCompany(c)) as Company[];
}

export async function getCompanies(params?: { search?: string; page?: number; page_size?: number }) {
  const data = await companiesBuilder.list(params);
  return data.companies.map((c) => toCompany(c)) as (Company & { vendor_count: number })[];
}

export async function getCompaniesPage(params?: { search?: string; page?: number; page_size?: number }) {
  const data = await companiesBuilder.list(params);
  return {
    companies: data.companies.map((c) => toCompany(c)) as (Company & { vendor_count: number })[],
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
  };
}

export async function getCompanyVendors(companyId: string) {
  const data = await companiesBuilder.getById(companyId);
  const vendors = (data as { assignedVendors?: Profile[] }).assignedVendors ?? [];
  return vendors.map((v) => toProfile(v as Parameters<typeof toProfile>[0]));
}

export async function updateWorkspace(companyId: string) {
  const { user } = await companiesBuilder.updateWorkspace(companyId);
  return toProfile(user as Parameters<typeof toProfile>[0]);
}

export async function updateProfile(name: string, email: string) {
  const { user } = await usersBuilder.updateMe({ name, email });
  return toProfile(user);
}

export async function changePassword(_currentPassword: string, newPassword: string) {
  return usersBuilder.changePassword({ currentPassword: _currentPassword, newPassword });
}

export async function getDashboardStats() {
  const stats = await referralsBuilder.getStats();
  return {
    total_vendors: stats.totalVendors ?? 0,
    total_companies: stats.totalCompanies ?? 0,
    total_referrals: stats.totalReferrals ?? 0,
  };
}
