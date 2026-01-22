import type { CarFilterParams } from './car-filter.types';

function stableParamsForKey(params: CarFilterParams) {
  // 🔒 queryKey باید stable باشه (array ها مرتب)
  return {
    locale: params.locale,
    branch_id: params.branch_id,
    from: params.from,
    to: params.to,

    car_id: params.car_id ?? null,
    search_title: params.search_title ?? '',
    sort: params.sort ?? 'price_min',
    min_p: typeof params.min_p === 'number' ? params.min_p : null,
    max_p: typeof params.max_p === 'number' ? params.max_p : null,
    cat_id: (params.cat_id ?? []).slice().sort((a, b) => a - b), // stable
  };
}

export const carFilterKey = (params: CarFilterParams) =>
  ['car-filter', stableParamsForKey(params)] as const;

export const carFilterInfiniteKey = (params: CarFilterParams) =>
  ['car-filter', 'infinite', stableParamsForKey(params)] as const;
