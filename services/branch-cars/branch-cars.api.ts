/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios";
import type { AxiosError } from "axios";
import type { BranchCarsResponse } from "./branch-cars.types";

export type BranchCarsParams = {
  page?: number;
  sort?: string | null;
  search_title?: string | null;

  cat_id?: number[] | null;
  brand?: number[] | null;

  gearbox?: string[] | null;
  fuel?: string[] | null;

  person?: number[] | null;
  baggage?: number[] | null;

  deposit?: string | null;
  free_delivery?: string | null;
  insurance?: string | null;
  km?: string | null;

  min_p?: number | null;
  max_p?: number | null;
};

export class BranchNotFoundError extends Error {
  status: number;

  constructor(message = "Branch not found", status = 404) {
    super(message);
    this.name = "BranchNotFoundError";
    this.status = status;
  }
}

const appendArray = (
  qs: URLSearchParams,
  key: string,
  values?: Array<string | number> | null
) => {
  if (!Array.isArray(values) || values.length === 0) return;

  values
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
    .forEach((v) => {
      qs.append(`${key}[]`, String(v));
    });
};

const buildQuery = (params?: BranchCarsParams) => {
  const qs = new URLSearchParams();
  if (!params) return qs.toString();

  if (params.page) {
    qs.set("page", String(params.page));
  }

  if (params.sort && String(params.sort).trim() !== "") {
    qs.set("sort", String(params.sort));
  }

  if (params.search_title && String(params.search_title).trim() !== "") {
    qs.set("search_title", String(params.search_title).trim());
  }

  appendArray(qs, "cat_id", params.cat_id);
  appendArray(qs, "brand", params.brand);
  appendArray(qs, "gearbox", params.gearbox);
  appendArray(qs, "fuel", params.fuel);
  appendArray(qs, "person", params.person);
  appendArray(qs, "baggage", params.baggage);

  if (params.deposit && String(params.deposit).trim() !== "") {
    qs.set("deposit", String(params.deposit));
  }

  if (params.free_delivery && String(params.free_delivery).trim() !== "") {
    qs.set("free_delivery", String(params.free_delivery));
  }

  if (params.insurance && String(params.insurance).trim() !== "") {
    qs.set("insurance", String(params.insurance));
  }

  if (params.km && String(params.km).trim() !== "") {
    qs.set("km", String(params.km));
  }

  if (params.min_p !== null && params.min_p !== undefined) {
    qs.set("min_p", String(params.min_p));
  }

  if (params.max_p !== null && params.max_p !== undefined) {
    qs.set("max_p", String(params.max_p));
  }

  return qs.toString();
};

export async function getBranchCars(
  slug: string,
  locale: string,
  params?: BranchCarsParams
): Promise<BranchCarsResponse> {
  const query = buildQuery(params);
  const url = query
    ? `/car/branch/${slug}/${locale}?${query}`
    : `/car/branch/${slug}/${locale}`;

  try {
    const res = await axios.get(url);

    if (Number(res.data?.status) === 404) {
      throw new BranchNotFoundError(res.data?.message || "Branch not found", 404);
    }

    if (!res.data?.data?.branch?.id) {
      throw new Error(res.data?.message || "Invalid API response: missing branch");
    }

    return res.data.data as BranchCarsResponse;
  } catch (error) {
    const err = error as AxiosError<any>;

    if (err.response?.status === 404) {
      throw new BranchNotFoundError(
        err.response?.data?.message || "Branch not found",
        404
      );
    }

    if (Number(err.response?.data?.status) === 404) {
      throw new BranchNotFoundError(
        err.response?.data?.message || "Branch not found",
        404
      );
    }

    throw error;
  }
}