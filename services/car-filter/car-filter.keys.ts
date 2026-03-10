
import type { CarFilterParams } from "./car-filter.types";

function normalizeStringArray(value?: string | string[]) {
  if (!value) return "";

  if (Array.isArray(value)) {
    return value
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .sort()
      .join(",");
  }

  return String(value || "").trim();
}

function normalizeNumberArray(value?: number | number[]) {
  if (value === undefined || value === null) return "";

  if (Array.isArray(value)) {
    return value
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x))
      .sort((a, b) => a - b)
      .join(",");
  }

  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "";
}

function stableParamsForKey(params: CarFilterParams) {
  return {
    locale: params.locale,
    branch_id: params.branch_id,

    from: params.from?.trim() ? params.from.trim() : null,
    to: params.to?.trim() ? params.to.trim() : null,
    dt: params.dt?.trim() ? params.dt.trim() : null,
    rt: params.rt?.trim() ? params.rt.trim() : null,

    page: params.page ?? null,
    car_id: params.car_id ?? null,

    search_title: (params.search_title ?? "").trim(),
    brand: normalizeStringArray(params.brand),

    sort: params.sort ?? null,
    min_p: typeof params.min_p === "number" ? params.min_p : null,
    max_p: typeof params.max_p === "number" ? params.max_p : null,

    cat_id: (params.cat_id ?? []).slice().sort((a, b) => a - b),

    gearbox: normalizeStringArray(params.gearbox as string | string[] | undefined),
    fuel: normalizeStringArray(params.fuel as string | string[] | undefined),
    person: normalizeNumberArray(params.person),
    baggage: normalizeNumberArray(params.baggage),

    deposit: params.deposit ?? null,
    free_delivery: params.free_delivery ?? null,
    insurance: params.insurance ?? null,
    km: params.km ?? null,
  };
}

export const carFilterKey = (params: CarFilterParams) =>
  ["car-filter", stableParamsForKey(params)] as const;

export const carFilterInfiniteKey = (params: CarFilterParams) =>
  ["car-filter", "infinite", stableParamsForKey(params)] as const;