export function buildQuery(
  current: URLSearchParams,
  patch: Record<string, string | number | null | undefined>,
) {
  const p = new URLSearchParams(current.toString());

  Object.entries(patch).forEach(([k, v]) => {
    if (v === null || v === undefined || v === "") p.delete(k);
    else p.set(k, String(v));
  });

  return p.toString();
}

export function getNumberParam(sp: URLSearchParams, key: string) {
  const raw = sp.get(key);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function getStringParam(sp: URLSearchParams, key: string) {
  const v = sp.get(key);
  return v && v !== "null" ? v : null;
}