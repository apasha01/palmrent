/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios"
import type { CarFilterParams, CarFilterResponse } from "./car-filter.types"

function toParams(params: CarFilterParams, page?: number) {
  const qp: Record<string, any> = {
    branch_id: params.branch_id,
    from: params.from,
    to: params.to,
    page: page ?? params.page ?? 1,

    car_id: params.car_id ?? undefined,
    cat_id: (params.cat_id?.length ? params.cat_id : undefined),

    search_title: params.search_title?.trim() ? params.search_title.trim() : undefined,

    min_p: typeof params.min_p === "number" ? params.min_p : undefined,
    max_p: typeof params.max_p === "number" ? params.max_p : undefined,
  }

  // time
  if (params.dt && String(params.dt).trim() !== "") qp.dt = params.dt
  if (params.rt && String(params.rt).trim() !== "") qp.rt = params.rt

  // sort
  if (params.sort && String(params.sort).trim() !== "") qp.sort = params.sort

  // پاکسازی undefined
  Object.keys(qp).forEach((k) => qp[k] === undefined && delete qp[k])

  return qp
}

/**
 * ✅ خروجی شما:
 * { success: true, message: null, data: { cars: [], currency: 'AED', rate_to_rial: 36000 } }
 */
function normalizeResponse(res: any): CarFilterResponse {
  const d = res?.data?.data ?? res?.data ?? {} // مقاوم

  return {
    cars: Array.isArray(d?.cars) ? d.cars : [],
    currency: typeof d?.currency === "string" ? d.currency : "",
    rate_to_rial: typeof d?.rate_to_rial === "number" ? d.rate_to_rial : null,
  }
}

export async function carFilter(params: CarFilterParams): Promise<CarFilterResponse> {
  const res = await axios.get(`/car/filter/${params.locale}`, {
    params: toParams(params),
  })
  return normalizeResponse(res)
}

export async function carFilterPage(
  params: CarFilterParams,
  page: number
): Promise<CarFilterResponse> {
  const res = await axios.get(`/car/filter/${params.locale}`, {
    params: toParams(params, page),
  })
  return normalizeResponse(res)
}
