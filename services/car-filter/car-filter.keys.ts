import type { CarFilterParams } from './car-filter.types';

function stableParamsForKey(params: CarFilterParams) {
  return {
    locale: params.locale,
    branch_id: params.branch_id,
    from: params.from,
    to: params.to,

    // ✅ NEW (stable)
    dt: params.dt ?? null,
    rt: params.rt ?? null,

    car_id: params.car_id ?? null,
    search_title: params.search_title ?? '',
    sort: params.sort ?? null,

    min_p: typeof params.min_p === 'number' ? params.min_p : null,
    max_p: typeof params.max_p === 'number' ? params.max_p : null,

    cat_id: (params.cat_id ?? []).slice().sort((a, b) => a - b),
  };
}

export const carFilterKey = (params: CarFilterParams) =>
  ['car-filter', stableParamsForKey(params)] as const;

export const carFilterInfiniteKey = (params: CarFilterParams) =>
  ['car-filter', 'infinite', stableParamsForKey(params)] as const;
