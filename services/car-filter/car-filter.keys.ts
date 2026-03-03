import type { CarFilterParams } from "./car-filter.types";

function normalizeBrandForKey(brand?: string | string[]) {
  if (!brand) return "";
  if (Array.isArray(brand)) {
    return brand
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .sort()
      .join(",");
  }
  return String(brand || "").trim();
}

function stableParamsForKey(params: CarFilterParams) {
  return {
    locale: params.locale,
    branch_id: params.branch_id,

    // ✅ برای key اگر نبودند => null
    from: params.from?.trim() ? params.from.trim() : null,
    to: params.to?.trim() ? params.to.trim() : null,

    dt: params.dt?.trim() ? params.dt.trim() : null,
    rt: params.rt?.trim() ? params.rt.trim() : null,

    car_id: params.car_id ?? null,

    search_title: (params.search_title ?? "").trim(),
    brand: normalizeBrandForKey(params.brand),

    sort: params.sort ?? null,

    min_p: typeof params.min_p === "number" ? params.min_p : null,
    max_p: typeof params.max_p === "number" ? params.max_p : null,

    cat_id: (params.cat_id ?? []).slice().sort((a, b) => a - b),
  };
}

export const carFilterKey = (params: CarFilterParams) =>
  ["car-filter", stableParamsForKey(params)] as const;

export const carFilterInfiniteKey = (params: CarFilterParams) =>
  ["car-filter", "infinite", stableParamsForKey(params)] as const;