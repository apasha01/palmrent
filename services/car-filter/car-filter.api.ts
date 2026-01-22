import axios from '@/lib/axios';
import type { CarFilterParams, CarFilterResponse } from './car-filter.types';

function toBody(params: CarFilterParams, page?: number) {
  return {
    branch_id: params.branch_id,
    from: params.from,
    to: params.to,

    page: page ?? params.page ?? 1,

    // optional
    car_id: params.car_id,
    cat_id: params.cat_id ?? [],
    search_title: params.search_title ?? '',
    sort: params.sort ?? 'price_min',
    min_p: typeof params.min_p === 'number' ? params.min_p : undefined,
    max_p: typeof params.max_p === 'number' ? params.max_p : undefined,
  };
}

export async function carFilter(params: CarFilterParams): Promise<CarFilterResponse> {
  const { locale } = params;
  const res = await axios.post(`/car/filter/${locale}`, toBody(params));
  // خروجی شما: { status: 200, data: { cars: [...] } }
  return {
    cars: res.data?.data?.cars ?? [],
  };
}

export async function carFilterPage(
  params: CarFilterParams,
  page: number
): Promise<CarFilterResponse> {
  const { locale } = params;
  const res = await axios.post(`/car/filter/${locale}`, toBody(params, page));
  return {
    cars: res.data?.data?.cars ?? [],
  };
}
