/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";
import type { CarFilterParams, CarFilterResponse } from "./car-filter.types";

function normalizeStringArrayParam(value?: string | string[]) {
  if (!value) return undefined;

  if (Array.isArray(value)) {
    const cleaned = value.map((x) => String(x || "").trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(",") : undefined;
  }

  const s = String(value || "").trim();
  return s ? s : undefined;
}

function normalizeNumberArrayParam(value?: number | number[]) {
  if (value === undefined || value === null) return undefined;

  if (Array.isArray(value)) {
    const cleaned = value
      .map((x) => Number(x))
      .filter((x) => Number.isFinite(x));

    return cleaned.length ? cleaned.join(",") : undefined;
  }

  const n = Number(value);
  return Number.isFinite(n) ? String(n) : undefined;
}

function toParams(params: CarFilterParams, page?: number) {
  const qp: Record<string, any> = {
    branch_id: params.branch_id,
    page: page ?? params.page ?? 1,

    car_id: params.car_id ?? undefined,
    cat_id: params.cat_id?.length ? params.cat_id : undefined,

    search_title: params.search_title?.trim() ? params.search_title.trim() : undefined,
    brand: normalizeStringArrayParam(params.brand),

    sort: params.sort && String(params.sort).trim() ? params.sort : undefined,

    min_p: typeof params.min_p === "number" ? params.min_p : undefined,
    max_p: typeof params.max_p === "number" ? params.max_p : undefined,

    gearbox: normalizeStringArrayParam(params.gearbox as string | string[] | undefined),
    fuel: normalizeStringArrayParam(params.fuel as string | string[] | undefined),
    person: normalizeNumberArrayParam(params.person),
    baggage: normalizeNumberArrayParam(params.baggage),

    deposit: params.deposit ? String(params.deposit).trim() : undefined,
    free_delivery: params.free_delivery ? String(params.free_delivery).trim() : undefined,
    insurance: params.insurance ? String(params.insurance).trim() : undefined,
    km: params.km ? String(params.km).trim() : undefined,
  };

  if (params.from && String(params.from).trim() !== "") qp.from = params.from;
  if (params.to && String(params.to).trim() !== "") qp.to = params.to;
  if (params.dt && String(params.dt).trim() !== "") qp.dt = params.dt;
  if (params.rt && String(params.rt).trim() !== "") qp.rt = params.rt;

  Object.keys(qp).forEach((k) => qp[k] === undefined && delete qp[k]);

  return qp;
}

function normalizeResponse(res: any): CarFilterResponse {
  const d = res?.data?.data ?? res?.data ?? {};

  return {
    cars: Array.isArray(d?.cars) ? d.cars : [],
    currency: typeof d?.currency === "string" ? d.currency : "",
    rate_to_rial: typeof d?.rate_to_rial === "number" ? d.rate_to_rial : null,

    page: typeof d?.page === "number" ? d.page : 1,
    per_page: typeof d?.per_page === "number" ? d.per_page : 0,
    total: typeof d?.total === "number" ? d.total : 0,
    has_more: typeof d?.has_more === "boolean" ? d.has_more : false,
  };
}

export async function carFilter(params: CarFilterParams): Promise<CarFilterResponse> {
  const res = await axios.get(`/car/filter/${params.locale}`, {
    params: toParams(params),
  });

  return normalizeResponse(res);
}

export async function carFilterPage(
  params: CarFilterParams,
  page: number,
): Promise<CarFilterResponse> {
  const res = await axios.get(`/car/filter/${params.locale}`, {
    params: toParams(params, page),
  });

  return normalizeResponse(res);
}