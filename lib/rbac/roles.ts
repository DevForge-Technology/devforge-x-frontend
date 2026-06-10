import { Role } from '../api/types';

export function isAdmin(role?: Role | string | null): boolean {
  return role === 'admin';
}

export function isVendor(role?: Role | string | null): boolean {
  return role === 'vendor';
}

export const ADMIN_ONLY_PATHS = ['/vendors', '/companies'];
export const AUTH_PATHS = ['/dashboard', '/referrals', '/profile'];
