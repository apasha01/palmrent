import axios from '@/lib/axios';
import type { Branch } from './branches.types';

type BranchApiItem = {
  id: number;
  slug: string;
  title: string;
  whatsapp: string | null;
  phone_call: string | null;
  photo: string | null;
};

type BranchApiResponse = {
  success: boolean;
  message: string | null;
  data: BranchApiItem[];
};

const STORAGE_URL = process.env.NEXT_PUBLIC_STORAGE_URL ?? '';

function normalizeImageUrl(path?: string | null): string | null {
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const cleanBase = STORAGE_URL.endsWith('/')
    ? STORAGE_URL.slice(0, -1)
    : STORAGE_URL;

  const cleanPath = path.startsWith('/')
    ? path.slice(1)
    : path;

  return `${cleanBase}/${cleanPath}`;
}

export async function getBranches(locale: string): Promise<Branch[]> {
  const res = await axios.get<BranchApiResponse>(`/branches/${locale}`);
  const items = res.data?.data ?? [];

  return items.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    whatsapp: item.whatsapp,
    phone_call: item.phone_call,
    photo: normalizeImageUrl(item.photo),
  }));
}