/* eslint-disable @typescript-eslint/no-explicit-any */

type GetReservePageDataArgs = {
  carId: number;
  locale: string;
  branchId: number;
  from: string;
  to: string;
  dt: string;
  rt: string;
};

function getBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error(
      "Missing backend base URL. Set NEXT_PUBLIC_BACKEND_URL or BACKEND_URL",
    );
  }

  return base.replace(/\/+$/, "");
}

/**
 * Normalizes the API response so the returned object always has:
 *   { item, places, options, currency, branch, ... }
 * regardless of whether the server wraps data in a `data` envelope or not.
 */
function normalizePayload(raw: any): any | null {
  if (!raw || typeof raw !== "object") return null;

  // Shape: { status, data: { item, places, ... } }
  if (raw?.data?.item) return raw.data;

  // Shape: { item, places, ... }  (already flat)
  if (raw?.item) return raw;

  return null;
}

export async function getReservePageDataServer({
  carId,
  locale,
  branchId,
  from,
  to,
  dt,
  rt,
}: GetReservePageDataArgs) {
  const qs = new URLSearchParams({
    branch_id: String(branchId),
    from,
    to,
    dt,
    rt,
  });

  const url = `${getBaseUrl()}/car/rent/${carId}/${locale}?${qs.toString()}`;

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const data = await res.json().catch(() => null);

  const status = data?.status ?? res.status;

  if (!res.ok || Number(status) !== 200) {
    throw new Error(data?.message || "Failed to fetch reserve page data");
  }

  const payload = normalizePayload(data);

  if (!payload?.item) {
    throw new Error("Invalid reserve page data: item not found");
  }

  // Always return the normalized flat payload so callers can do payload.item directly
  return payload;
}