/* eslint-disable @typescript-eslint/no-explicit-any */
export type Car = any

export type BranchCarsResponse = {
  branch?: any
  categories?: any[]
  brands?: any[]
  children?: any[]
  cars?: Car[]

  page?: number
  per_page?: number
  has_more?: boolean

  // ✅✅✅ جدید (مثل filter_car)
  currency?: string
  rate_to_rial?: number | null
}
