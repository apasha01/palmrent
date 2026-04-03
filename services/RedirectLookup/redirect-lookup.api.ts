/* eslint-disable @typescript-eslint/no-explicit-any */

import axios from "@/lib/axios";

export type RedirectLookupApiResponse = {
  found?: boolean;
  type?: number;
  destination?: string | null;
};

export type RedirectLookupResult = {
  found: boolean;
  type: number | null;
  destination: string | null;
};

const buildQuery = (path: string) => {
  const qs = new URLSearchParams();

  if (path) {
    qs.set("path", path);
  }

  return qs.toString();
};

export async function getRedirectLookup(
  path: string,
): Promise<RedirectLookupResult> {
  const query = buildQuery(path);
  const url = query ? `/redirects/lookup?${query}` : `/redirects/lookup`;

  const res = await axios.get<RedirectLookupApiResponse>(url);

  return {
    found: Boolean(res.data?.found),
    type: typeof res.data?.type === "number" ? res.data.type : null,
    destination: res.data?.destination ?? null,
  };
}