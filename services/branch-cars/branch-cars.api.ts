/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "@/lib/axios"
import { BranchCarsResponse } from "./branch-cars.types"

export type BranchCarsParams = {
  page?: number
  sort?: string | null
  search_title?: string | null
  cat_id?: number[] | null
}

const buildQuery = (params?: BranchCarsParams) => {
  const qs = new URLSearchParams()
  if (!params) return qs.toString()

  if (params.page) qs.set("page", String(params.page))

  // ✅✅✅ فقط وقتی sort واقعی داریم بفرست
  if (params.sort && String(params.sort).trim() !== "") qs.set("sort", String(params.sort))

  if (params.search_title && String(params.search_title).trim() !== "") {
    qs.set("search_title", String(params.search_title))
  }

  // ✅ cat_id[] برای بک
  if (Array.isArray(params.cat_id) && params.cat_id.length > 0) {
    params.cat_id.forEach((id) => qs.append("cat_id[]", String(id)))
  }

  return qs.toString()
}

// export async function getBranchCars(slug: string, locale: string, params?: BranchCarsParams) {
//   const query = buildQuery(params)
//   const url = query ? `/car/branch/${slug}/${locale}?${query}` : `/car/branch/${slug}/${locale}`

//   const res = await axios.get(url)

//   // ✅ خروجی: res.data.data
//   // data شامل: cars, categories, branch, currency, rate_to_rial, has_more, page, per_page...
//   return res.data?.data
// }

export async function getBranchCars(slug: string, locale: string, params?: BranchCarsParams): Promise<BranchCarsResponse> {
  const query = buildQuery(params)
  const url = query ? `/car/branch/${slug}/${locale}?${query}` : `/car/branch/${slug}/${locale}`

  const res = await axios.get(url)
  console.log(res)

  if (!res.data?.data) {
    throw new Error(res.data?.message || "Invalid API response: missing data")
  }

  return res.data.data as BranchCarsResponse
}
