
import axios from '@/lib/axios';
import type { Branch } from './branches.types';

export async function getBranches(locale: string): Promise<Branch[]> {
  const res = await axios.get(`/branches/${locale}`);
  return res.data?.data ?? [];
}
