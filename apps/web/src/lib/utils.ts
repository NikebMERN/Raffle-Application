import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: { role: { code: string; name: string } }[];
  wallet?: { balance: number; currency: string };
}

export interface Raffle {
  id: string;
  title: string;
  description?: string;
  status: string;
  ticketPrice: number;
  startDate?: string;
  endDate?: string;
  rounds?: { id: string; title: string; prizes: { id: string; name: string; value: number }[] }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Request failed');
  }

  return res.json();
}

export function hasRole(user: User | null, ...roles: string[]) {
  if (!user) return false;
  return user.roles.some((r) => roles.includes(r.role.code));
}
