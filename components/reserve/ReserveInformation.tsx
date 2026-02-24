/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import * as React from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"

import jalaali from "jalaali-js"
import Link from "next/link"
import { toast } from "react-toastify"
import SearchMetaClient from "@/services/seo/SearchMetaClient"
import { getBranchNameById } from "@/helpers/BranchNameHelper"
import { useSearchPageStore } from "@/zustand/stores/car-search/search-page.store"
import { calcRentDaysWithGrace, normalizeTime } from "@/lib/rent-days"
import { api } from "@/lib/apiClient"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { UserSearch } from "lucide-react"
import { PhoneInput } from "react-international-phone"
import "react-international-phone/style.css"
import { InformationStepSkeleton } from "@/components/Loadings/InformationSetupSkeleton"
import InfoListDialog from "@/components/InfoListPopup"
import ResponsiveLocationPicker from "@/components/search/extra/ResponsiveLocationPicker"
import { ExtrasList, formatNum } from "@/components/search/helpers/utils"
import { signIn, signOut, useSession } from "next-auth/react"
import CouponDialog from "@/components/reserve/CouponDialog"
import SelectedCarCard from "./SelectedCarCard"
import SummaryCard from "./SummaryCard"
import NoDepositBanner from "./NoDepositeBanner"
import { useRouter, useSearchParams } from "next/navigation"


/* ---------------- types (minimal) ---------------- */
type ApiCalcResponse = any
type LocationState = { isDesired: boolean; location: any; address: string }
type Totals = {
  total: number
  prePay: number
  debt: number
  tax: number
  rentDays: number
  dailyPrice: number
  extraItems: { optionId?: number; title: string; price: number; subLabel?: React.ReactNode }[]
}
type UserInfo = { name: string; email: string; phone: string }

/* ---------------- cache ---------------- */
const calcCache = new Map<string, ApiCalcResponse>()
const calcInflight = new Map<string, Promise<ApiCalcResponse>>()

/* ---------------- utils ---------------- */
function oneLine(s: any) {
  return String(s ?? "").replace(/\s+/g, " ").trim()
}
function shortAddr(s: any, max = 50) {
  const x = oneLine(s)
  if (!x) return ""
  return x.length > max ? x.slice(0, max) + "…" : x
}
function safeNum(v: any, fallback = 0): number {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""))
  return Number.isFinite(n) ? n : fallback
}
function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}
function normalizePhone(p: any) {
  const s = String(p ?? "").replace(/[^\d+]/g, "").trim()
  if (!s) return ""
  if (s.startsWith("0098")) return "+98" + s.slice(4)
  if (s.startsWith("098")) return "+98" + s.slice(3)
  if (s.startsWith("98") && !s.startsWith("+98")) return "+98" + s.slice(2)
  if (s.startsWith("0") && s.length === 11) return "+98" + s.slice(1)
  return s
}

/* -------- URL normalize helpers -------- */
function toEnglishDigits(input: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹"
  const ar = "٠١٢٣٤٥٦٧٨٩"
  return String(input)
    .split("")
    .map((ch) => {
      const faIndex = fa.indexOf(ch)
      if (faIndex !== -1) return String(faIndex)
      const arIndex = ar.indexOf(ch)
      if (arIndex !== -1) return String(arIndex)
      return ch
    })
    .join("")
}
function pad2(n: number) {
  return String(n).padStart(2, "0")
}
function normalizeJalaliParam(input?: string | null) {
  if (!input) return null
  const clean = toEnglishDigits(String(input)).replace(/-/g, "/").trim()
  const [y, m, d] = clean.split("/").map((x) => parseInt(x, 10))
  if (!y || !m || !d) return null
  return `${y}/${pad2(m)}/${pad2(d)}`
}

/** ✅ pricing extractor */
function useRentPricing(apiData: ApiCalcResponse | null, rentDays: number) {
  return useMemo(() => {
    const item: any = apiData?.item || {}
    const offPercent = clamp(safeNum(item.off, 0), 0, 100)

    const dailyAfter =
      safeNum(item.rent_price_day_after_discount, 0) ||
      safeNum(item.rent_price_day, 0) ||
      safeNum(item.final_price, 0) ||
      0

    const dailyBefore =
      safeNum(item.rent_price_day_before_discount, 0) ||
      safeNum(item.rent_price, 0) ||
      (offPercent > 0 && dailyAfter > 0 ? dailyAfter / (1 - offPercent / 100) : dailyAfter)

    const totalAfter =
      safeNum(item.rent_total_after_discount, 0) ||
      safeNum(item.pay_price, 0) ||
      dailyAfter * (rentDays || 1)

    const totalBefore = safeNum(item.rent_total_before_discount, 0) || dailyBefore * (rentDays || 1)

    return { offPercent, dailyBefore, dailyAfter, totalBefore, totalAfter }
  }, [apiData, rentDays])
}

export default function ReserveInformation() {
  const t = useTranslations("InformationStep")
  const locale = useLocale()
  const searchParams = useSearchParams()
  const router = useRouter()

  // STORE
  const storeCarDates = useSearchPageStore((s) => s.carDates)
  const storeDt = useSearchPageStore((s) => s.deliveryTime)
  const storeRt = useSearchPageStore((s) => s.returnTime)
  const storeSelectedCarId = useSearchPageStore((s) => s.selectedCarId)

  // URL (normalized)
  const urlFrom = normalizeJalaliParam(searchParams.get("from"))
  const urlTo = normalizeJalaliParam(searchParams.get("to"))
  const urlDt = normalizeTime(searchParams.get("dt") || "10:00")
  const urlRt = normalizeTime(searchParams.get("rt") || "10:00")

  // effective dates (store has priority, then url)
  const carDates = useMemo(() => {
    const s0 = normalizeJalaliParam(storeCarDates?.[0] ?? null)
    const s1 = normalizeJalaliParam(storeCarDates?.[1] ?? null)
    if (s0 && s1) return [s0, s1] as const
    if (urlFrom && urlTo) return [urlFrom, urlTo] as const
    return null
  }, [storeCarDates, urlFrom, urlTo])

  // effective times
  const dt = useMemo(() => normalizeTime(storeDt || urlDt || "10:00"), [storeDt, urlDt])
  const rt = useMemo(() => normalizeTime(storeRt || urlRt || "10:00"), [storeRt, urlRt])

  const branchIdFromUrl = useMemo(() => {
    const raw = searchParams.get("branch_id")
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }, [searchParams])

  const selectedCarId = useMemo(() => {
    const urlId = searchParams.get("car_id")
    if (urlId && urlId !== "null") return urlId
    if (storeSelectedCarId) return String(storeSelectedCarId)
    return null
  }, [searchParams, storeSelectedCarId])

  const tBranches = useTranslations("branchs")

  const branchName = useMemo(() => {
    const id = searchParams.get("branch_id")
    return getBranchNameById(tBranches, id, "")
  }, [searchParams, tBranches])

  // UI State
  const [deliveryLocation, setDeliveryLocation] = useState<LocationState>({
    isDesired: false,
    location: null,
    address: "",
  })
  const [returnLocation, setReturnLocation] = useState<LocationState>({
    isDesired: false,
    location: null,
    address: "",
  })
  const [returnDifferent, setReturnDifferent] = useState<boolean>(false)

  const [isInfoListOpen, setIsInfoListOpen] = useState<boolean>(false)
  const [apiData, setApiData] = useState<ApiCalcResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [insuranceComplete, setInsuranceComplete] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", email: "", phone: "" })

  const [pendingSummaryIds, setPendingSummaryIds] = useState<Record<number, boolean>>({})
  const pendingTimersRef = useRef<Record<number, any>>({})

  function triggerSummarySkeleton(optionId: number, ms = 1000) {
    const id = Number(optionId)
    if (!Number.isFinite(id)) return
    if (pendingTimersRef.current[id]) clearTimeout(pendingTimersRef.current[id])

    setPendingSummaryIds((prev) => ({ ...prev, [id]: true }))
    pendingTimersRef.current[id] = setTimeout(() => {
      setPendingSummaryIds((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      delete pendingTimersRef.current[id]
    }, ms)
  }

  useEffect(() => {
    return () => {
      Object.values(pendingTimersRef.current).forEach((tt) => tt && clearTimeout(tt))
      pendingTimersRef.current = {}
    }
  }, [])

  // session autofill
  const { data: session, status: sessionStatus } = useSession()
  useEffect(() => {
    if (sessionStatus !== "authenticated") return
    const u: any = (session as any)?.user ?? {}
    const fullName =
      (u?.name && String(u.name).trim()) ||
      [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
      ""
    const phoneRaw = u?.phone ?? u?.username ?? u?.mobile ?? ""
    const phone = normalizePhone(phoneRaw)
    const email = (u?.email && String(u.email).trim()) || ""

    setUserInfo((prev) => ({
      name: prev.name?.trim() ? prev.name : fullName,
      phone: prev.phone?.trim() ? prev.phone : phone,
      email: prev.email?.trim() ? prev.email : email,
    }))
  }, [sessionStatus, session])

  // reset when car changes
  const prevCarRef = useRef<string | null>(null)
  useEffect(() => {
    const cur = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null
    if (prevCarRef.current === null) {
      prevCarRef.current = cur
      return
    }
    if (prevCarRef.current !== cur) {
      prevCarRef.current = cur
      setSelectedOptions([])
      setInsuranceComplete(false)
      setDeliveryLocation({ isDesired: false, location: null, address: "" })
      setReturnLocation({ isDesired: false, location: null, address: "" })
      setReturnDifferent(false)
    }
  }, [selectedCarId])

  // ✅ Coupon dialog
  const [couponOpen, setCouponOpen] = useState(false)

  const rentDaysForTitle = useMemo(() => {
    if (!carDates?.[0] || !carDates?.[1]) return 0
    try {
      return calcRentDaysWithGrace({
        fromDateJalali: carDates[0],
        toDateJalali: carDates[1],
        deliveryTime: dt,
        returnTime: rt,
        graceMinutes: 90,
        jalaliToDate: (jy, jm, jd) => {
          const g = jalaali.toGregorian(jy, jm + 1, jd)
          return new Date(g.gy, g.gm - 1, g.gd)
        },
      })
    } catch {
      return 0
    }
  }, [carDates, dt, rt])

  // fetchKey
  const fetchKey = useMemo(() => {
    const carId = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : ""
    const branchId = branchIdFromUrl ? String(branchIdFromUrl) : ""
    const from = carDates?.[0] || ""
    const to = carDates?.[1] || ""
    const loc = locale || ""
    return `${carId}|${branchId}|${from}|${to}|${loc}|${dt}|${rt}`
  }, [selectedCarId, branchIdFromUrl, carDates, locale, dt, rt])

  /**
   * ✅ FIX اصلی:
   *
   * مشکل قبلی:
   * lastFetchKeyRef روی module-level یا بین mount/unmountها persist میشد.
   * وقتی component remount میشد (key جدید)، lastFetchKeyRef.current
   * هنوز مقدار قبلی داشت (چون ref مقداری از closure قبلی نگه داشته بود).
   * نتیجه: fetchKey === lastFetchKeyRef.current => return زودهنگام
   * => isLoading هیچ‌وقت false نمیشد => skeleton ابدی!
   *
   * راه‌حل:
   * lastFetchKeyRef رو با مقدار "" initialize کن (هر بار mount جدید = مقدار خالی)
   * و دیگه از early return بر اساس ref استفاده نکن.
   * به جاش از یه flag داخل effect استفاده میکنیم که اگه fetchKey
   * همون چیزی بود که قبلاً fetch شده (و apiData موجوده)، skip کنیم.
   */
  const lastFetchKeyRef = useRef<string>("")
  // ✅ این ref رو هر بار mount ریست کن
  // چون useRef مقدار اولیه "" داره، هر بار که component از نو mount میشه (key جدید)
  // این ref هم از نو "" میشه — این کافیه!

  // ✅ fetch api
  useEffect(() => {
    const carIdRaw = selectedCarId && selectedCarId !== "null" ? String(selectedCarId) : null
    const branchIdRaw = branchIdFromUrl != null ? String(branchIdFromUrl) : null
    const from = carDates?.[0]
    const to = carDates?.[1]

    if (!carIdRaw || !branchIdRaw || !from || !to) {
      // پارامترهای لازم نیستن => نه loading، نه data
      lastFetchKeyRef.current = ""
      setIsLoading(false)
      setApiData(null)
      return
    }

    // ✅ FIX: اگه همین fetchKey قبلاً fetch شده AND apiData داریم => skip
    // (نه فقط ref check — چون ممکنه ref درست باشه ولی apiData null باشه)
    if (lastFetchKeyRef.current === fetchKey && apiData !== null) {
      // داده موجوده، نیازی به fetch مجدد نیست
      setIsLoading(false)
      return
    }

    // ✅ اگه fetchKey جدیده (یا apiData null هست)، fetch کن
    lastFetchKeyRef.current = fetchKey
    setIsLoading(true)
    setApiData(null)

    let alive = true

    async function run() {
      try {
        // ✅ اول cache چک کن
        const cached = calcCache.get(fetchKey)
        if (cached) {
          if (!alive) return
          setApiData(cached)
          setIsLoading(false)
          return
        }

        // ✅ اگه inflight هست، صبر کن
        const inflight = calcInflight.get(fetchKey)
        if (inflight) {
          const data = await inflight
          if (!alive) return
          setApiData(data)
          setIsLoading(false)
          return
        }

        const params = new URLSearchParams()
        params.append("branch_id", String(branchIdRaw))
        params.append("from", String(from))
        params.append("to", String(to))
        params.append("dt", dt)
        params.append("rt", rt)

        const url = `/car/rent/${carIdRaw}/${locale}?${params.toString()}`

        const promise = (async () => {
          const res: any = await api.get(url)
          const payload = (res?.data ?? res) as ApiCalcResponse
          const status = res?.status ?? (payload as any)?.status

          if (status && Number(status) !== 200) throw new Error((payload as any)?.message || t("toast.fetchInfoError"))
          if (!payload?.item) throw new Error(t("toast.invalidServerResponse"))
          return payload
        })()

        calcInflight.set(fetchKey, promise)
        const data = await promise
        calcInflight.delete(fetchKey)
        calcCache.set(fetchKey, data)

        if (!alive) return
        setApiData(data)
      } catch (error: any) {
        calcInflight.delete(fetchKey)
        if (alive) {
          toast.error(error?.message || t("toast.serverConnectionError"))
        }
      } finally {
        if (alive) {
          setIsLoading(false)
        }
      }
    }

    run()
    return () => {
      alive = false
    }
    // ✅ apiData رو از dependency list حذف میکنیم تا loop نشه
    // چون apiData set شدنش باعث re-run effect میشه که دوباره fetch میکنه
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, selectedCarId, branchIdFromUrl, carDates, locale, dt, rt, t])

  const activePlaces = useMemo(() => (Array.isArray(apiData?.places) ? apiData!.places!.filter(Boolean) : []), [apiData])

  const currencyLabel = useMemo(() => {
    const cur = String((apiData as any)?.currency || "").trim().toUpperCase()
    if (!cur) return ""
    return (t as any).has?.(`currency.${cur}`) ? t(`currency.${cur}`) : cur
  }, [apiData, t])

  const payableOptions = useMemo(() => {
    const opts = Array.isArray((apiData as any)?.options) ? (apiData as any).options.filter(Boolean) : []
    return opts.filter((o: any) => {
      const p = safeNum(o?.price, 0)
      const pp = safeNum(o?.price_pay, 0)
      return p > 0 || pp > 0
    })
  }, [apiData])

  const canSelectInsuranceComplete = useMemo(() => {
    return String((apiData?.item as any)?.insurance_complete_status || "no").toLowerCase() === "yes"
  }, [apiData])

  const shouldShowExtrasSection = useMemo(
    () => payableOptions.length > 0 || canSelectInsuranceComplete,
    [payableOptions, canSelectInsuranceComplete],
  )

  useEffect(() => {
    const allowed = new Set(payableOptions.map((o: any) => Number(o?.id)))
    setSelectedOptions((prev) => prev.filter((id) => allowed.has(Number(id))))
  }, [payableOptions])

  const totals: Totals = useMemo(() => {
    const safeTotals: Totals = { total: 0, prePay: 0, debt: 0, tax: 0, rentDays: 0, dailyPrice: 0, extraItems: [] }
    if (!apiData?.item) return safeTotals

    let totalPrice = safeNum((apiData.item as any).pay_price, 0)
    let prePayPrice = safeNum((apiData.item as any).pre_pay_price, 0)

    let rentDays = 1
    try {
      if (carDates?.length === 2) {
        rentDays = calcRentDaysWithGrace({
          fromDateJalali: carDates[0],
          toDateJalali: carDates[1],
          deliveryTime: dt,
          returnTime: rt,
          graceMinutes: 90,
          jalaliToDate: (jy, jm, jd) => {
            const g = jalaali.toGregorian(jy, jm + 1, jd)
            return new Date(g.gy, g.gm - 1, g.gd)
          },
        })
      }
    } catch {
      rentDays = safeNum((apiData.item as any).rent_days, 1)
    }
    rentDays = rentDays > 0 ? rentDays : 1

    const extraItems: Totals["extraItems"] = []

    selectedOptions.forEach((optId) => {
      const opt = (payableOptions as any[]).find((o) => Number(o?.id) === Number(optId))
      if (!opt) return

      const optPrice = safeNum((opt as any).price_pay, 0)
      const preOpt = safeNum((opt as any).pre_price_pay, 0)

      totalPrice += optPrice
      prePayPrice += preOpt

      const perDay = rentDays > 0 ? Math.round(optPrice / rentDays) : optPrice

      extraItems.push({
        optionId: Number(optId),
        title: (opt as any).title,
        price: optPrice,
        subLabel: (
          <span className="inline-flex items-center gap-1">
            <span className="text-gray-500">{t("common.dailyPrice")}:</span>
            <span className="text-gray-500">
              {formatNum(perDay)} {currencyLabel}
            </span>
          </span>
        ),
      })
    })

    if (insuranceComplete) {
      const insPrice = safeNum((apiData.item as any).insurance_complete_price_pay, 0)
      const insPre = safeNum((apiData.item as any).pre_price_insurance_complete_price_pay, 0)
      totalPrice += insPrice
      prePayPrice += insPre

      const perDay =
        safeNum((apiData.item as any).insurance_complete_price, 0) ||
        (rentDays > 0 ? Math.round(insPrice / rentDays) : insPrice)

      extraItems.push({
        optionId: -999,
        title: t("extras.insuranceCompleteTitle"),
        price: insPrice,
        subLabel: (
          <span className="inline-flex items-center gap-1">
            <span className="text-gray-500">
              {formatNum(perDay)} {currencyLabel}
            </span>
            <span className="text-gray-500">{t("common.daily")}</span>
          </span>
        ),
      })
    }

    if (Array.isArray(apiData.places)) {
      const places = apiData.places.filter(Boolean)
      const getPlaceById = (id: any) => places.find((p) => p && String((p as any).id) === String(id))

      const isHotelField = (addressTitle: any) => {
        const s = String(addressTitle ?? "").toLowerCase()
        return s.includes("هتل") || s.includes("hotel")
      }

      const hotelSuffix = (placeObj: any, addr: any) => {
        const a = oneLine(addr)
        if (!a) return ""
        const title = (placeObj as any)?.address_title
        if (!isHotelField(title)) return ""
        return ` (${shortAddr(a, 35)})`
      }

      if (deliveryLocation?.location) {
        const del = getPlaceById((deliveryLocation as any).location)
        const delPrice = safeNum((del as any)?.price_pay, 0)
        const delPre = safeNum((del as any)?.pre_price_pay, 0)
        totalPrice += delPrice
        prePayPrice += delPre

        const delNeedAddr = String((del as any)?.need_address || "no") === "yes"
        const delHotel = delNeedAddr ? hotelSuffix(del, (deliveryLocation as any)?.address) : ""

        extraItems.push({
          title: `${t("places.deliveryPrefix")}: ${(del as any)?.title || t("common.unknown")}${delHotel}`,
          price: delPrice,
        })
      }

      const effectiveReturn = returnDifferent ? returnLocation : deliveryLocation
      if ((effectiveReturn as any)?.location) {
        const ret = getPlaceById((effectiveReturn as any).location)
        const retPrice = safeNum((ret as any)?.price_pay, 0)
        const retPre = safeNum((ret as any)?.pre_price_pay, 0)

        if (returnDifferent) {
          totalPrice += retPrice
          prePayPrice += retPre
        }

        const retNeedAddr = String((ret as any)?.need_address || "no") === "yes"
        const retAddrValue = returnDifferent ? (returnLocation as any)?.address : (deliveryLocation as any)?.address
        const retHotel = retNeedAddr ? hotelSuffix(ret, retAddrValue) : ""

        extraItems.push({
          title: `${t("places.returnPrefix")}: ${(ret as any)?.title || t("common.unknown")}${retHotel}`,
          price: retPrice,
        })
      }
    }

    let tax = 0
    const taxPercent = safeNum((apiData.item as any).tax_percent, 0)
    if (taxPercent > 0) {
      tax = totalPrice * (taxPercent / 100)
      totalPrice += tax
      if ((apiData as any).collage_tax_in === "no") prePayPrice += tax
    }

    return {
      total: totalPrice,
      prePay: prePayPrice,
      debt: totalPrice - prePayPrice,
      tax,
      rentDays,
      dailyPrice: 0,
      extraItems,
    }
  }, [apiData, payableOptions, selectedOptions, insuranceComplete, deliveryLocation, returnLocation, returnDifferent, carDates, dt, rt, currencyLabel, t])

  const pricing = useRentPricing(apiData, totals.rentDays)
  const offPercent = pricing.offPercent
  const dailyBefore = pricing.dailyBefore
  const dailyAfter = pricing.dailyAfter
  const baseRentAfter = pricing.totalAfter

  const dynamicTitle = useMemo(() => {
    const b = branchName ? ` - ${branchName}` : ""
    const d = rentDaysForTitle > 0 ? ` - ${t("common.days", { count: rentDaysForTitle })}` : ""
    const car = (apiData as any)?.item?.title ? ` - ${String((apiData as any).item.title).trim()}` : ""
    return t("meta.title", { branch: b, car, days: d })
  }, [branchName, rentDaysForTitle, apiData, t])

  const dynamicDesc = useMemo(() => {
    const branchPart = branchName ? t("meta.branchIn", { branch: branchName }) : ""
    const daysPart = rentDaysForTitle > 0 ? t("meta.forDays", { days: rentDaysForTitle }) : ""
    const carPart = (apiData as any)?.item?.title
      ? t("meta.carInParens", { car: String((apiData as any).item.title).trim() })
      : ""
    return t("meta.desc", { branchPart, daysPart, carPart })
  }, [branchName, rentDaysForTitle, apiData, t])

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return

    if (!userInfo.name || !userInfo.phone) {
      toast.warning(t("toast.enterNamePhone"))
      return
    }
    if (!deliveryLocation?.location) {
      toast.warning(t("toast.selectDeliveryPlace"))
      return
    }
    if (returnDifferent && !returnLocation?.location) {
      toast.warning(t("toast.selectReturnPlace"))
      return
    }

    setIsSubmitting(true)

    const wasLoggedIn = sessionStatus === "authenticated"
    const sessionPhone = wasLoggedIn
      ? normalizePhone(
          (session as any)?.user?.mobile ??
            (session as any)?.user?.username ??
            (session as any)?.user?.phone ??
            "",
        )
      : ""
    const formPhone = normalizePhone(userInfo.phone)

    const shouldLogoutBeforeSubmit = Boolean(wasLoggedIn && sessionPhone && formPhone && sessionPhone !== formPhone)
    if (shouldLogoutBeforeSubmit) {
      try {
        await signOut({ redirect: false })
      } catch {}
    }

    try {
      if (!carDates?.[0] || !carDates?.[1] || !branchIdFromUrl) {
        toast.error(t("toast.invalidReservationInfo"))
        return
      }
      if (!selectedCarId) {
        toast.error(t("toast.carNotSelected"))
        return
      }

      const places = Array.isArray(apiData?.places) ? apiData!.places!.filter(Boolean) : []
      const findPlace = (id: any) => places.find((p: any) => String(p?.id) === String(id))

      const delObj = findPlace((deliveryLocation as any).location)
      const delNeed = delObj?.need_address === "yes"

      const retId = returnDifferent
        ? (returnLocation as any).location || (deliveryLocation as any).location
        : (deliveryLocation as any).location
      const retObj = findPlace(retId)
      const retNeed = retObj?.need_address === "yes"

      const payload = {
        branch_id: branchIdFromUrl || 1,
        from: carDates[0],
        to: carDates[1],
        dt: normalizeTime(dt),
        rt: normalizeTime(rt),

        place_delivery: (deliveryLocation as any).location,
        address_delivery: delNeed ? (deliveryLocation as any).address || "" : "",

        place_return: returnDifferent
          ? (returnLocation as any).location || (deliveryLocation as any).location
          : (deliveryLocation as any).location,
        address_return: retNeed
          ? returnDifferent
            ? (returnLocation as any).address || ""
            : (deliveryLocation as any).address || ""
          : "",

        place_r_custom: returnDifferent ? "yes" : "no",

        first_name: userInfo.name,
        last_name: "",
        phone: userInfo.phone,
        email: userInfo.email,
        option_check: selectedOptions,
        insurance_complete: insuranceComplete ? "yes" : "no",
      }

      const res: any = await api.post(`/car/rent/${selectedCarId}/${locale}/registration`, payload)
      const raw: any = res?.data ?? res
      const status = res?.status ?? raw?.status
      if (status && Number(status) !== 200) throw new Error(raw?.message || t("toast.reserveSubmitError"))

      const payloadData: any = raw?.data ?? raw
      const rentCode =
        payloadData?.item?.rent_code ??
        payloadData?.rent_code ??
        payloadData?.data?.item?.rent_code ??
        payloadData?.data?.rent_code ??
        null

      if (!rentCode) {
        toast.warning(t("toast.reservedButNoRentCode"))
        return
      }

      const isNewUser = payloadData?.is_new_user === true || payloadData?.data?.is_new_user === true
      const token = payloadData?.access_token ?? payloadData?.data?.access_token ?? null
      const userId = payloadData?.user_id ?? payloadData?.data?.user_id ?? null

      const username =
        payloadData?.username ??
        payloadData?.data?.username ??
        payloadData?.item?.phone ??
        payloadData?.data?.item?.phone ??
        ""

      const nameFromApi = payloadData?.item?.name ?? payloadData?.data?.item?.name ?? userInfo.name ?? ""
      const phoneFromApi = payloadData?.item?.phone ?? payloadData?.data?.item?.phone ?? userInfo.phone ?? ""
      const emailFromApi = payloadData?.item?.email ?? payloadData?.data?.item?.email ?? userInfo.email ?? ""

      if (isNewUser && token) {
        try {
          await signIn("token", {
            redirect: false,
            accessToken: String(token),
            user_id: userId != null ? String(userId) : "",
            username: String(username),
            phone: String(phoneFromApi),
            name: String(nameFromApi),
            email: emailFromApi ? String(emailFromApi) : "",
          })
        } catch {}
      }

      const paymentUrl = payloadData?.payment_url || payloadData?.item?.payment_url
      const cb = encodeURIComponent(`/rent/reservation?status=initialize&code=${encodeURIComponent(rentCode)}`)

      if (paymentUrl) {
        const joiner = String(paymentUrl).includes("?") ? "&" : "?"
        window.location.href = `${paymentUrl}${joiner}callback=${cb}`
        return
      }

      toast.success(t("toast.reserveRequestDone"))
      router.push(`/rent/reservation?status=initialize&code=${encodeURIComponent(rentCode)}`)
    } catch (error: any) {
      toast.error(error?.message || t("toast.reserveSubmitError"))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    apiData,
    branchIdFromUrl,
    carDates,
    deliveryLocation,
    dt,
    insuranceComplete,
    isSubmitting,
    locale,
    returnDifferent,
    returnLocation,
    router,
    rt,
    selectedCarId,
    selectedOptions,
    session,
    sessionStatus,
    t,
    userInfo,
  ])

  const handleSelectUser = (user: { name?: string; phone?: string; email?: string }) => {
    setUserInfo({ name: user.name || "", phone: user.phone || "", email: user.email || "" })
    setIsInfoListOpen(false)
  }

  if (isLoading || !apiData) {
    return (
      <>
        <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />
        <InformationStepSkeleton />
      </>
    )
  }

  const showNoDeposit = String((apiData.item as any)?.deposit || "").toLowerCase() === "no"
  const showUnlimitedKm = String((apiData.item as any)?.km || "").toLowerCase() === "no"
  const showFreeDelivery = String((apiData.item as any)?.free_delivery || "").toLowerCase() === "yes"
  const showFreeInsurance = String((apiData.item as any)?.insurance || "").toLowerCase() === "yes"

  const showDeposit = String((apiData.item as any)?.deposit || "").toLowerCase() === "yes"
  const depositPrice = safeNum((apiData.item as any)?.deposit_price, 0)

  const PersonalInfoCard = (
    <Card className="border p-4 m-0 border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
      <CardHeader className="p-0 m-0">
        <CardTitle className="text-base text-gray-900 flex justify-between items-center gap-2">
          <p>{t("personalInfo.title")}</p>

          <div className="flex items-center justify-between">
            <Button variant="link" className="px-0 text-blue-600 font-semibold" onClick={() => setIsInfoListOpen(true)}>
              <UserSearch size={16} className="ml-2" />
              {t("personalInfo.alreadyRegistered")}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 m-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <div className="md:col-span-5">
            <Input
              value={userInfo.name}
              onChange={(e) => setUserInfo((p) => ({ ...p, name: e.target.value }))}
              className="h-12 rounded-lg border-gray-300"
              placeholder={t("personalInfo.placeholders.fullName")}
            />
          </div>

          <div className="md:col-span-4 overflow-visible">
            <div dir="ltr" className="w-full overflow-visible relative z-50">
              <PhoneInput
                defaultCountry="ir"
                value={userInfo.phone}
                onChange={(phone: string) => setUserInfo((p) => ({ ...p, phone }))}
                className="w-full"
                inputClassName="!h-12 !w-full !border-0 !bg-transparent !text-sm !outline-none !shadow-none !ring-0 !focus:ring-0 !focus:outline-none !pl-3"
                countrySelectorStyleProps={{
                  buttonClassName:
                    "!h-12 !px-3 !border-0 !bg-transparent !outline-none !shadow-none !ring-0 !focus:ring-0 !focus:outline-none",
                }}
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Input
              value={userInfo.email}
              onChange={(e) => setUserInfo((p) => ({ ...p, email: e.target.value }))}
              className="h-12 rounded-lg border-gray-300"
              placeholder={t("personalInfo.placeholders.email")}
              type="email"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 text-center mt-6">
          {t("rules.rulesB")}{" "}
          <Link className="text-blue-600 underline" href={"/rules"}>
            {t("rules.rules2")}
          </Link>{" "}
          {t("rules.rulesA")}
        </div>
      </CardContent>
    </Card>
  )

  const DeliveryCard = (
    <Card className="border border-gray-200 rounded-xl shadow-sm py-3">
      <CardHeader className="m-0 px-4">
        <CardTitle className="text-base text-gray-900 flex items-center gap-2">{t("deliveryCard.title")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 px-4">
        <ResponsiveLocationPicker
          title={t("deliveryCard.deliveryPickerTitle")}
          currencyLabel={currencyLabel}
          places={activePlaces as any}
          value={deliveryLocation}
          onChange={setDeliveryLocation}
          placeholder={t("deliveryCard.deliveryPickerPlaceholder")}
        />

        <div className="flex items-center justify-between p-0 pb-4 m-0">
          <Label className="flex items-center gap-3 cursor-pointer select-none">
            <Switch
              dir="ltr"
              checked={returnDifferent}
              onCheckedChange={(v) => {
                const next = Boolean(v)
                setReturnDifferent(next)
                if (!next) setReturnLocation({ isDesired: false, location: null, address: "" })
              }}
            />
            <span className="text-gray-800 font-semibold">{t("deliveryCard.returnDifferentLabel")}</span>
          </Label>
        </div>

        {returnDifferent && (
          <ResponsiveLocationPicker
            title={t("deliveryCard.returnPickerTitle")}
            currencyLabel={currencyLabel}
            places={activePlaces as any}
            value={returnLocation}
            onChange={setReturnLocation}
            placeholder={t("deliveryCard.returnPickerPlaceholder")}
          />
        )}
      </CardContent>
    </Card>
  )

  const ExtrasCard = !shouldShowExtrasSection ? null : (
    <Card className="border border-gray-200 dark:border-gray-800 rounded-xl md:mb-4 shadow-sm p-0 m-0 gap-0 bg-white dark:bg-gray-900">
      <CardHeader className="p-0 px-4 pt-2">
        <CardTitle className="text-base text-gray-900 flex items-center">{t("extras.title")}</CardTitle>
      </CardHeader>

      <CardContent className="p-0 m-0 pb-1">
        <ExtrasList
          options={payableOptions}
          selected={selectedOptions}
          setSelected={setSelectedOptions}
          currencyLabel={currencyLabel}
          insuranceComplete={insuranceComplete}
          setInsuranceComplete={(v: boolean) => {
            if (!canSelectInsuranceComplete) return
            triggerSummarySkeleton(-999)
            setInsuranceComplete(Boolean(v))
          }}
          insuranceCompleteEnabled={canSelectInsuranceComplete}
          insuranceCompleteDailyPrice={safeNum((apiData?.item as any)?.insurance_complete_price, 0)}
          onSelectionVisualChange={(changedOptionId: number) => triggerSummarySkeleton(Number(changedOptionId))}
        />
      </CardContent>
    </Card>
  )

  return (
    <>
      <SearchMetaClient title={dynamicTitle} description={dynamicDesc} />
      <CouponDialog open={couponOpen} onOpenChange={setCouponOpen} />

      <div className="relative">
        {/* MOBILE */}
        <div className="lg:hidden pb-28">
          <SelectedCarCard
            apiData={apiData}
            totals={totals}
            currencyLabel={currencyLabel}
            offPercent={offPercent}
            dailyBefore={dailyBefore}
            dailyAfter={dailyAfter}
            showUnlimitedKm={showUnlimitedKm}
            showFreeDelivery={showFreeDelivery}
            showFreeInsurance={showFreeInsurance}
            showNoDeposit={showNoDeposit}
            showDeposit={showDeposit}
            depositPrice={depositPrice}
          />

          <div className="px-2">
            {showNoDeposit ? <div className="mt-2"> <NoDepositBanner /> </div> : null}
            <div className="mt-2">{DeliveryCard}</div>
            <div className="mt-2">{ExtrasCard}</div>

            <div className="mt-2">
              <SummaryCard
                showButton={false}
                apiData={apiData}
                totals={totals}
                currencyLabel={currencyLabel}
                baseRentAfter={baseRentAfter}
                offPercent={offPercent}
                dailyBefore={dailyBefore}
                dailyAfter={dailyAfter}
                pendingSummaryIds={pendingSummaryIds}
                onOpenCoupon={() => setCouponOpen(true)}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>

            <div className="mt-2">{PersonalInfoCard}</div>
          </div>
        </div>

        {/* Sticky Bottom Bar (Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-60 bg-white border-t border-gray-200">
          <div className="max-w-130 mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">{t("mobileBar.payableAmount")}</div>
              <div className="text-lg font-extrabold text-blue-600">
                {formatNum(totals.prePay)} {currencyLabel}
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl text-base font-extrabold bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? t("common.submitting") : t("common.finalSubmit")}
            </Button>
          </div>
        </div>

        {/* DESKTOP */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              {showNoDeposit ? <NoDepositBanner /> : null}
              {DeliveryCard}
              {ExtrasCard}
              {PersonalInfoCard}
            </div>

            <div className="lg:col-span-4 space-y-0">
              <SelectedCarCard
                apiData={apiData}
                totals={totals}
                currencyLabel={currencyLabel}
                offPercent={offPercent}
                dailyBefore={dailyBefore}
                dailyAfter={dailyAfter}
                showUnlimitedKm={showUnlimitedKm}
                showFreeDelivery={showFreeDelivery}
                showFreeInsurance={showFreeInsurance}
                showNoDeposit={showNoDeposit}
                showDeposit={showDeposit}
                depositPrice={depositPrice}
              />

              <div className="mt-4">
                <SummaryCard
                  showButton
                  apiData={apiData}
                  totals={totals}
                  currencyLabel={currencyLabel}
                  baseRentAfter={baseRentAfter}
                  offPercent={offPercent}
                  dailyBefore={dailyBefore}
                  dailyAfter={dailyAfter}
                  pendingSummaryIds={pendingSummaryIds}
                  onOpenCoupon={() => setCouponOpen(true)}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        </div>

        {/* InfoList */}
        {isInfoListOpen && (
          <InfoListDialog open={isInfoListOpen} onOpenChange={setIsInfoListOpen} onSelect={handleSelectUser} />
        )}
      </div>
    </>
  )
}